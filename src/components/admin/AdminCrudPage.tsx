import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "select" | "image";
  options?: string[];
  required?: boolean;
}

type TableName = "members" | "events" | "projects" | "achievements" | "advisors" | "alumni" | "pages" | "faqs";

interface Props {
  tableName: TableName;
  title: string;
  fields: FieldDef[];
  columns: string[];
  orderBy?: string;
}

const AdminCrudPage = ({ tableName, title, fields, columns, orderBy }: Props) => {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    const { data } = await supabase.from(tableName).select("*").order(orderBy ?? "created_at", { ascending: orderBy === "display_order" });
    setRows(data ?? []);
  }, [tableName, orderBy]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const openNew = () => {
    setEditing(null);
    const defaults: Record<string, unknown> = {};
    fields.forEach((f) => { defaults[f.key] = f.type === "number" ? 0 : f.type === "boolean" ? true : f.type === "select" && f.options?.length ? f.options[0] : ""; });
    setForm(defaults);
    setOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    const vals: Record<string, unknown> = {};
    fields.forEach((f) => { vals[f.key] = row[f.key] ?? ""; });
    setForm(vals);
    setOpen(true);
  };

  const save = async () => {
    setLoading(true);
    if (editing) {
      const { error } = await supabase.from(tableName).update(form).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Updated" }); }
    } else {
      const { error } = await supabase.from(tableName).insert(form as Record<string, unknown>);
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
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Button onClick={openNew} size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add</Button>
      </div>

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
              <TableRow key={row.id}>
                {columns.map((c) => (
                  <TableCell key={c} className="max-w-[200px] truncate">
                    {typeof row[c] === "boolean" ? (row[c] ? "Yes" : "No") : String(row[c] ?? "")}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(row)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => remove(row.id)} title="Delete" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
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
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                ) : f.type === "number" ? (
                  <Input type="number" value={form[f.key] ?? 0} onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })} />
                ) : f.type === "select" ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form[f.key] ?? ""}
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
                ) : f.type === "image" ? (
                  <div className="flex flex-col gap-2">
                    {form[f.key] && <img src={form[f.key]} alt="Preview" className="h-32 w-32 object-cover rounded-md border border-border" />}
                    <Input 
                      type="file" 
                      accept="image/*"
                      disabled={loading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setLoading(true);
                        const name = `${Date.now()}-${file.name}`;
                        const { data, error } = await supabase.storage.from("media").upload(name, file);
                        if (error) {
                          toast({ title: "Upload failed", description: error.message, variant: "destructive" });
                        } else {
                          const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(data.path);
                          setForm({ ...form, [f.key]: publicUrl });
                        }
                        setLoading(false);
                      }} 
                    />
                  </div>
                ) : (
                  <Input value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
                )}
              </div>
            ))}
          </div>
          <Button onClick={save} disabled={loading} className="w-full">{loading ? "Saving…" : "Save"}</Button>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCrudPage;
