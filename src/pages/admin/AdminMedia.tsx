import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, Copy, Image as ImageIcon, FileText, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
}

const AdminMedia = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    const { data, error } = await supabase.storage.from("media").list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setFiles((data as MediaFile[]) ?? []);
  };

  useEffect(() => { fetchFiles(); }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const name = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("media").upload(name, file);
      if (error) toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setUploading(false);
    toast({ title: `${fileList.length} file(s) uploaded` });
    fetchFiles();
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    const { error } = await supabase.storage.from("media").remove([name]);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchFiles(); }
  };

  const getUrl = (name: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(name);
    return data.publicUrl;
  };

  const copyUrl = (name: string) => {
    navigator.clipboard.writeText(getUrl(name));
    toast({ title: "URL copied to clipboard" });
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(name);
  const isVideo = (name: string) => /\.(mp4|webm|mov|avi)$/i.test(name);

  const filtered = files.filter((f) => f.name !== ".emptyFolderPlaceholder" && f.name.toLowerCase().includes(search.toLowerCase()));

  const formatSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" multiple className="hidden" onChange={upload} accept="image/*,video/*,.pdf,.svg" />
          <Button onClick={() => fileRef.current?.click()} size="sm" disabled={uploading}>
            <Upload className="mr-1.5 h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      <Input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 text-muted-foreground">
          <ImageIcon className="mb-3 h-10 w-10" />
          <p>No media files yet. Upload some!</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((file) => (
            <div key={file.id ?? file.name} className="group relative rounded-lg border border-border bg-card overflow-hidden">
              <div className="aspect-square flex items-center justify-center bg-muted/50">
                {isImage(file.name) ? (
                  <img src={getUrl(file.name)} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                ) : isVideo(file.name) ? (
                  <Film className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(file.metadata?.size)}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="outline" size="sm" onClick={() => copyUrl(file.name)} title="Copy URL"><Copy className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => remove(file.name)} title="Delete" className="text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMedia;
