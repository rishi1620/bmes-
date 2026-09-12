import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, Loader2, RefreshCw, Copy, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import MediaSelectorDialog from "./MediaSelectorDialog";
import { Skeleton } from "@/components/ui/skeleton";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "select" | "image" | "datetime" | "list" | "slider";
  options?: string[];
  required?: boolean;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

type TableName = "members" | "events" | "projects" | "achievements" | "advisors" | "alumni" | "pages" | "contact_submissions" | "event_registrations" | "membership_registrations" | "home_sections" | "media_library" | "site_settings" | "user_roles" | "blog_posts" | "faqs";

interface Props {
  tableName: TableName;
  title: string;
  description?: string;
  fields: FieldDef[];
  columns: string[];
  orderBy?: string;
  filter?: (row: Record<string, unknown>) => boolean;
  defaultValues?: Record<string, unknown>;
  hiddenFields?: string[];
  addLabel?: string;
}

const AdminCrudTable = ({ tableName, title, description, fields, columns, orderBy, filter, defaultValues, hiddenFields = [], addLabel }: Props) => {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setIsFetching(true);
    const selectQuery = columns.length > 0 ? Array.from(new Set([...columns, "id"])).join(",") : "*";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.from(tableName as any).select(selectQuery).order(orderBy ?? "created_at", { ascending: orderBy === "display_order" });
    if (error) {
      console.error("Supabase fetch error:", error);
      toast({ title: "Error fetching data", description: error.message, variant: "destructive" });
    } else {
      console.log(`Supabase fetched rows for ${tableName}:`, data);
    }
    const allRows = (data as unknown as Record<string, unknown>[]) ?? [];
    setRows(filter ? allRows.filter(filter) : allRows);
    setIsFetching(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, orderBy]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const openNew = () => {
    setEditing(null);
    const defaults: Record<string, unknown> = { ...defaultValues };
    fields.forEach((f) => {
        if (defaults[f.key] === undefined) {
             defaults[f.key] = f.type === "number" ? 0 : f.type === "boolean" ? true : f.type === "select" && f.options?.length ? f.options[0] : "";
        }
    });
    setForm(defaults);
    setOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    const vals: Record<string, unknown> = {};
    fields.forEach((f) => { vals[f.key] = row[f.key] ?? ""; });
    // Merge default values if they are missing
    if (defaultValues) {
        Object.keys(defaultValues).forEach(k => {
            if (vals[k] === undefined || vals[k] === "") {
                vals[k] = defaultValues[k];
            }
        });
    }
    setForm(vals);
    setOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSupabaseError = (error: any) => {
    if (error.code === '23505') {
      if (error.message?.includes('email')) {
        return "An entry with this email already exists.";
      }
      if (error.message?.includes('slug')) {
        return "An entry with this slug already exists. Please choose a unique slug.";
      }
      return "A unique constraint violation occurred. Please check for duplicate values.";
    }
    if (error.code === '23503') {
      return "Cannot delete this item because it is referenced by other records.";
    }
    return error.message || "An unexpected error occurred.";
  };

  const save = async () => {
    setLoading(true);
    const payload = { ...form };
    // Ensure default values are present only if not already set in form
    if (defaultValues) {
        Object.keys(defaultValues).forEach(k => {
            if (payload[k] === undefined || payload[k] === "") {
                payload[k] = defaultValues[k];
            }
        });
    }

    if (editing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(tableName as any).update(payload).eq("id", editing.id as string);
      if (error) { 
        toast({ title: "Error Updating", description: handleSupabaseError(error), variant: "destructive" }); 
        setLoading(false);
        return;
      }
      else { toast({ title: "Updated successfully" }); }
    } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(tableName as any).insert(payload as unknown as any);
      if (error) { 
        toast({ title: "Error Creating", description: handleSupabaseError(error), variant: "destructive" }); 
        setLoading(false);
        return;
      }
      else { toast({ title: "Created successfully" }); }
    }
    setLoading(false);
    setOpen(false);
    fetchRows();
  };

  const duplicateRow = async (row: Record<string, unknown>) => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...payload } = row;
    
    // Append " (Copy)" to the name or title if it exists
    if (typeof payload.name === 'string') {
      payload.name = `${payload.name} (Copy)`;
    } else if (typeof payload.title === 'string') {
      payload.title = `${payload.title} (Copy)`;
    }
    
    if (typeof payload.slug === 'string') {
      payload.slug = `${payload.slug}-copy-${Math.floor(Math.random() * 1000)}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(tableName as any).insert(payload as unknown as any);
    if (error) { toast({ title: "Error duplicating", description: handleSupabaseError(error), variant: "destructive" }); }
    else { toast({ title: "Duplicated successfully" }); fetchRows(); }
    setLoading(false);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(tableName as any).delete().eq("id", deleteId);
    if (error) { toast({ title: "Error Deleting", description: handleSupabaseError(error), variant: "destructive" }); }
    else { toast({ title: "Deleted successfully" }); fetchRows(); }
    setDeleteId(null);
  };

  const fieldLabel = (key: string) => fields.find((f) => f.key === key)?.label ?? key;
  const renderCell = (row: Record<string, unknown>, c: string, field: FieldDef | undefined) => {
    if (field?.render) return field.render(row[c], row);
    
    if (typeof row[c] === "boolean") return (
      <Badge variant={row[c] ? "default" : "secondary"} className={row[c] ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
        {row[c] ? "Active" : "Inactive"}
      </Badge>
    );

    if (field?.type === "datetime") return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{format(new Date(row[c] as string), "MMM d, yyyy")}</span>
        <span className="text-xs text-muted-foreground">{format(new Date(row[c] as string), "h:mm a")}</span>
      </div>
    );
    
    if (field?.type === "list") return (
      <div className="flex flex-wrap gap-1">
        {Array.isArray(row[c]) ? (row[c] as string[]).map((item, i) => (
          <Badge key={i} variant="outline" className="text-[10px] font-normal">{item}</Badge>
        )) : String(row[c] ?? "")}
      </div>
    );

    if (field?.type === "image" && row[c]) return (
      <img src={row[c] as string} alt="Thumbnail" className="h-9 w-9 rounded-md object-cover border shadow-sm" />
    );

    if (field?.type === "slider") return (
      <div className="flex items-center gap-2 w-full max-w-[150px]">
        <Progress value={Number(row[c]) || 0} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground w-8 text-right">{Number(row[c]) || 0}%</span>
      </div>
    );

    return <span className="text-sm">{String(row[c] ?? "")}</span>;
  };

  const filteredRows = rows.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const exportCSV = () => {
    if (filteredRows.length === 0) {
      toast({ title: "No data to export", variant: "default" });
      return;
    }
    
    // Use columns to determine headers
    const headers = columns;
    const csvContent = [
      headers.map(c => fieldLabel(c)).join(","),
      ...filteredRows.map(row => 
        headers.map(c => {
          const field = fields.find(f => f.key === c);
          let val = row[c];
          if (field?.render) {
            const rendered = field.render(val, row);
            if (typeof rendered === 'string' || typeof rendered === 'number') {
              val = rendered;
            }
          }
          if (val === null || val === undefined) return '""';
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          return `"${String(val)}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${tableName}_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 pr-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={fetchRows} disabled={isFetching} title="Refresh Data">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={filteredRows.length === 0} title="Download CSV">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={openNew} className="gap-1.5 font-semibold shadow-sm w-full sm:w-auto">
            <Plus className="h-4 w-4" /> {addLabel || "Add New"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  {columns.map((c) => <TableHead key={c} className="font-semibold">{fieldLabel(c)}</TableHead>)}
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      {columns.map((c) => (
                        <TableCell key={c} className="py-4">
                          <Skeleton className="h-5 w-full max-w-[200px]" />
                        </TableCell>
                      ))}
                      <TableCell className="text-right py-4">
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p>No results found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id as string} className="hover:bg-muted/50 transition-colors">
                      {columns.map((c) => {
                        const field = fields.find(f => f.key === c);
                        return (
                          <TableCell key={c} className="max-w-[300px] truncate py-3">
                            {renderCell(row, c, field)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Edit" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => duplicateRow(row)} title="Duplicate" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(row.id as string)} title="Delete" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{editing ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {fields.filter(f => !hiddenFields.includes(f.key)).map((f) => (
              <div key={f.key} className={`space-y-2 ${f.type === 'textarea' || f.type === 'image' || f.type === 'list' ? 'md:col-span-2' : ''}`}>
                <Label className="text-sm font-medium">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </Label>
                
                {f.type === "textarea" ? (
                  <Textarea 
                    value={form[f.key] as string ?? ""} 
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="min-h-[120px] resize-y"
                  />
                ) : f.type === "number" ? (
                  <Input 
                    type="number" 
                    value={form[f.key] as number ?? 0} 
                    onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })} 
                  />
                ) : f.type === "select" ? (
                  <Select 
                    value={(form[f.key] as string) || "none"} 
                    onValueChange={(val) => setForm({ ...form, [f.key]: val === "none" ? "" : val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => <SelectItem key={o || "none"} value={o || "none"}>{o || "(none)"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : f.type === "boolean" ? (
                  <div className="flex items-center space-x-3 pt-1">
                    <Switch 
                      checked={form[f.key] as boolean} 
                      onCheckedChange={(checked) => setForm({ ...form, [f.key]: checked })} 
                    />
                    <span className="text-sm font-medium text-muted-foreground">{form[f.key] ? "Yes (Active)" : "No (Inactive)"}</span>
                  </div>
                ) : f.type === "datetime" ? (
                  <Input 
                    type="datetime-local" 
                    value={typeof form[f.key] === 'string' ? (form[f.key] as string).slice(0, 16) : ""} 
                    onChange={(e) => setForm({ ...form, [f.key]: new Date(e.target.value).toISOString() })} 
                  />
                ) : f.type === "list" ? (
                  <div className="space-y-2">
                    <Input 
                      placeholder="Comma separated values..." 
                      value={Array.isArray(form[f.key]) ? (form[f.key] as string[]).join(", ") : (form[f.key] as string ?? "")} 
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
                    />
                    <p className="text-[10px] text-muted-foreground">Enter items separated by commas.</p>
                  </div>
                ) : f.type === "image" ? (
                  <div className="flex flex-col gap-3 rounded-md border p-4 bg-muted/10">
                    {form[f.key] && (
                      <div className="relative aspect-video w-full max-w-sm mx-auto overflow-hidden rounded-md border bg-background shadow-sm">
                        <img src={form[f.key] as string} alt="Preview" className="h-full w-full object-contain" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input 
                        value={form[f.key] as string ?? ""} 
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} 
                        placeholder="Image URL"
                        className="flex-1"
                      />
                      <MediaSelectorDialog 
                        onSelect={(url) => setForm({ ...form, [f.key]: url })} 
                      />
                    </div>
                  </div>
                ) : f.type === "slider" ? (
                  <div className="flex items-center gap-4 pt-2">
                    <Slider 
                      value={[Number(form[f.key]) || 0]} 
                      onValueChange={(vals) => setForm({ ...form, [f.key]: vals[0] })} 
                      max={100} 
                      step={1} 
                      className="flex-1"
                    />
                    <span className="w-12 text-right text-sm font-medium">{Number(form[f.key]) || 0}%</span>
                  </div>
                ) : (
                  <Input 
                    value={form[f.key] as string ?? ""} 
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} 
                    required={f.required} 
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AdminCrudTable;
