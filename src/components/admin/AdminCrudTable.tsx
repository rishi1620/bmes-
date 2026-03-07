import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { format } from "date-fns";
import MediaSelectorDialog from "./MediaSelectorDialog";
import PageHeader from "@/components/layout/PageHeader";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "select" | "image" | "datetime" | "list";
  options?: string[];
  required?: boolean;
}

type TableName = "members" | "events" | "projects" | "achievements" | "advisors" | "alumni" | "pages" | "faqs" | "event_registrations";

interface Props {
  tableName: TableName;
  title: string;
  fields: FieldDef[];
  columns: string[];
  orderBy?: string;
  filter?: (row: Record<string, unknown>) => boolean;
  defaultValues?: Record<string, unknown>;
  hiddenFields?: string[];
}

const AdminCrudTable = ({ tableName, title, fields, columns, orderBy, filter, defaultValues, hiddenFields = [] }: Props) => {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    const { data } = await supabase.from(tableName).select("*").order(orderBy ?? "created_at", { ascending: orderBy === "display_order" });
    const allRows = data ?? [];
    setRows(filter ? allRows.filter(filter) : allRows);
  }, [tableName, orderBy, filter]);

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
      const { error } = await supabase.from(tableName).update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Updated" }); }
    } else {
      const { error } = await supabase.from(tableName).insert(payload as Record<string, unknown>);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Created" }); }
    }
    setLoading(false);
    setOpen(false);
    fetchRows();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Deleted" }); fetchRows(); }
  };

  const fieldLabel = (key: string) => fields.find((f) => f.key === key)?.label ?? key;

  return (
    <div>
      <PageHeader 
        title={title} 
        action={<Button onClick={openNew} size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add</Button>} 
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => <TableHead key={c}>{fieldLabel(c)}</TableHead>)}
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">No items yet</TableCell></TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id as string}>
                {columns.map((c) => {
                  const field = fields.find(f => f.key === c);
                  return (
                    <TableCell key={c} className="max-w-[300px] truncate">
                      {typeof row[c] === "boolean" ? (
                        row[c] ? "Yes" : "No"
                      ) : field?.type === "datetime" ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium">{format(new Date(row[c] as string), "PPp")}</span>
                          <div className="scale-75 origin-left">
                            <CountdownTimer targetDate={row[c] as string} />
                          </div>
                        </div>
                      ) : field?.type === "list" ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(row[c]) ? (row[c] as string[]).map((item, i) => (
                            <span key={i} className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{item}</span>
                          )) : String(row[c] ?? "")}
                        </div>
                      ) : (
                        String(row[c] ?? "")
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(row)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => remove(row.id as string)} title="Delete" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} {title.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.filter(f => !hiddenFields.includes(f.key)).map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea value={form[f.key] as string ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                ) : f.type === "number" ? (
                  <Input type="number" value={form[f.key] as number ?? 0} onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })} />
                ) : f.type === "select" ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form[f.key] as string ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    {f.options?.map((o) => <option key={o} value={o}>{o || "(none)"}</option>)}
                  </select>
                ) : f.type === "boolean" ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form[f.key] ? "true" : "false"}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value === "true" })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : f.type === "datetime" ? (
                  <Input 
                    type="datetime-local" 
                    value={typeof form[f.key] === 'string' ? (form[f.key] as string).slice(0, 16) : ""} 
                    onChange={(e) => setForm({ ...form, [f.key]: new Date(e.target.value).toISOString() })} 
                  />
                ) : f.type === "list" ? (
                  <div className="space-y-1">
                    <Input 
                      placeholder="Comma separated values..." 
                      value={Array.isArray(form[f.key]) ? (form[f.key] as string[]).join(", ") : (form[f.key] as string ?? "")} 
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
                    />
                    <p className="text-[10px] text-muted-foreground">Enter items separated by commas.</p>
                  </div>
                ) : f.type === "image" ? (
                  <div className="flex flex-col gap-2">
                    {form[f.key] && <img src={form[f.key] as string} alt="Preview" className="h-32 w-32 object-cover rounded-md border border-border" />}
                    <div className="flex gap-2">
                      <Input 
                        value={form[f.key] as string ?? ""} 
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} 
                        placeholder="Image URL"
                      />
                      <MediaSelectorDialog 
                        onSelect={(url) => setForm({ ...form, [f.key]: url })} 
                      />
                    </div>
                  </div>
                ) : (
                  <Input value={form[f.key] as string ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
                )}
              </div>
            ))}
          </div>
          <Button onClick={save} disabled={loading} className="w-full">{loading ? "Saving…" : "Save"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCrudTable;
