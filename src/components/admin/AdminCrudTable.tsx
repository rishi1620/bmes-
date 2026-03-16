import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import MediaSelectorDialog from "./MediaSelectorDialog";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "select" | "image" | "datetime" | "list";
  options?: string[];
  required?: boolean;
}

type TableName = "members" | "events" | "projects" | "achievements" | "advisors" | "alumni" | "pages" | "faqs" | "event_registrations";

interface Props<T extends Record<string, any> = Record<string, any>> {
  tableName: TableName;
  title: string;
  description?: string;
  fields: FieldDef[];
  columns: string[];
  orderBy?: string;
  filter?: (row: T) => boolean;
  defaultValues?: Partial<T>;
  hiddenFields?: string[];
  addLabel?: string;
  transformRow?: (row: any) => T;
  transformPayload?: (payload: T) => any;
}

const AdminCrudTable = <T extends Record<string, any> = Record<string, any>>({ 
  tableName, 
  title, 
  description, 
  fields, 
  columns, 
  orderBy, 
  filter, 
  defaultValues, 
  hiddenFields = [], 
  addLabel, 
  transformRow, 
  transformPayload 
}: Props<T>) => {
  const [rows, setRows] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRows = useCallback(async () => {
    // Using 'as any' for tableName because some tables like 'faqs' might be missing from generated types
    const { data } = await supabase.from(tableName as any).select("*").order(orderBy ?? "created_at", { ascending: orderBy === "display_order" });
    let allRows = (data as any[]) ?? [];
    if (transformRow) {
      allRows = allRows.map(transformRow);
    }
    setRows(filter ? allRows.filter(filter) : allRows);
  }, [tableName, orderBy, filter, transformRow]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const openNew = () => {
    setEditing(null);
    const defaults: Partial<T> = { ...defaultValues } as Partial<T>;
    fields.forEach((f) => {
        if (defaults[f.key as keyof T] === undefined) {
             (defaults as any)[f.key] = f.type === "number" ? 0 : f.type === "boolean" ? true : f.type === "select" && f.options?.length ? f.options[0] : "";
        }
    });
    setForm(defaults);
    setOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    const vals: Partial<T> = {};
    fields.forEach((f) => { (vals as any)[f.key] = row[f.key] ?? ""; });
    // Merge default values if they are missing
    if (defaultValues) {
        Object.keys(defaultValues).forEach(k => {
            if ((vals as any)[k] === undefined || (vals as any)[k] === "") {
                (vals as any)[k] = (defaultValues as any)[k];
            }
        });
    }
    setForm(vals);
    setOpen(true);
  };

  const save = async () => {
    setLoading(true);
    let payload: any = { ...form };
    // Ensure default values are present only if not already set in form
    if (defaultValues) {
        Object.keys(defaultValues).forEach(k => {
            if (payload[k] === undefined || payload[k] === "") {
                payload[k] = (defaultValues as any)[k];
            }
        });
    }

    if (transformPayload) {
      payload = transformPayload(payload as T);
    }

    if (editing) {
      const { error } = await supabase.from(tableName as any).update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Updated successfully" }); }
    } else {
      const { error } = await supabase.from(tableName as any).insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Created successfully" }); }
    }
    setLoading(false);
    setOpen(false);
    fetchRows();
  };

  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    const { error } = await supabase.from(tableName as any).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Deleted successfully" }); fetchRows(); }
  };

  const fieldLabel = (key: string) => fields.find((f) => f.key === key)?.label ?? key;

  const filteredRows = rows.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={openNew} className="gap-1 font-semibold shadow-sm">
            <Plus className="h-4 w-4" /> {addLabel || "Add New"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((c) => <TableHead key={c} className="font-semibold">{fieldLabel(c)}</TableHead>)}
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
              {filteredRows.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex} className="hover:bg-muted/50">
                  {columns.map((c) => {
                    const field = fields.find(f => f.key === c);
                    const value = row[c];
                    return (
                      <TableCell key={c} className="max-w-[300px] truncate py-3">
                        {typeof value === "boolean" ? (
                          <Badge variant={value ? "default" : "secondary"} className={value ? "bg-green-500 hover:bg-green-600" : ""}>
                            {value ? "Active" : "Inactive"}
                          </Badge>
                        ) : field?.type === "datetime" ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{value ? format(new Date(value as string), "MMM d, yyyy") : ""}</span>
                            <span className="text-xs text-muted-foreground">{value ? format(new Date(value as string), "h:mm a") : ""}</span>
                          </div>
                        ) : field?.type === "list" ? (
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(value) ? (value as string[]).map((item, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] font-normal">{item}</Badge>
                            )) : String(value ?? "")}
                          </div>
                        ) : field?.type === "image" && value ? (
                          <img src={value as string} alt="Thumbnail" className="h-8 w-8 rounded object-cover border" />
                        ) : (
                          <span className="text-sm">{String(value ?? "")}</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Edit" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(row.id as string)} title="Delete" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {fields.filter(f => !hiddenFields.includes(f.key)).map((f) => (
              <div key={f.key} className="space-y-2">
                <Label className="text-sm font-medium">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </Label>
                
                {f.type === "textarea" ? (
                  <Textarea 
                    value={(form as any)[f.key] as string ?? ""} 
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value } as Partial<T>)}
                    className="min-h-[100px]"
                  />
                ) : f.type === "number" ? (
                  <Input 
                    type="number" 
                    value={(form as any)[f.key] as number ?? 0} 
                    onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) } as Partial<T>)} 
                  />
                ) : f.type === "select" ? (
                  <Select 
                    value={(form as any)[f.key] as string ?? ""} 
                    onValueChange={(val) => setForm({ ...form, [f.key]: val } as Partial<T>)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => <SelectItem key={o} value={o}>{o || "(none)"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : f.type === "boolean" ? (
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={(form as any)[f.key] as boolean} 
                      onCheckedChange={(checked) => setForm({ ...form, [f.key]: checked } as Partial<T>)} 
                    />
                    <span className="text-sm text-muted-foreground">{(form as any)[f.key] ? "Yes" : "No"}</span>
                  </div>
                ) : f.type === "datetime" ? (
                  <Input 
                    type="datetime-local" 
                    value={typeof (form as any)[f.key] === 'string' ? ((form as any)[f.key] as string).slice(0, 16) : ""} 
                    onChange={(e) => setForm({ ...form, [f.key]: new Date(e.target.value).toISOString() } as Partial<T>)} 
                  />
                ) : f.type === "list" ? (
                  <div className="space-y-2">
                    <Input 
                      placeholder="Comma separated values..." 
                      value={Array.isArray((form as any)[f.key]) ? ((form as any)[f.key] as string[]).join(", ") : ((form as any)[f.key] as string ?? "")} 
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } as Partial<T>)} 
                    />
                    <p className="text-[10px] text-muted-foreground">Enter items separated by commas.</p>
                  </div>
                ) : f.type === "image" ? (
                  <div className="flex flex-col gap-3 rounded-md border p-3 bg-muted/20">
                    {(form as any)[f.key] && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-background">
                        <img src={(form as any)[f.key] as string} alt="Preview" className="h-full w-full object-contain" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input 
                        value={(form as any)[f.key] as string ?? ""} 
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value } as Partial<T>)} 
                        placeholder="Image URL"
                        className="flex-1"
                      />
                      <MediaSelectorDialog 
                        onSelect={(url) => setForm({ ...form, [f.key]: url } as Partial<T>)} 
                      />
                    </div>
                  </div>
                ) : (
                  <Input 
                    value={(form as any)[f.key] as string ?? ""} 
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value } as Partial<T>)} 
                    required={f.required} 
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminCrudTable;
