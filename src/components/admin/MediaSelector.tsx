import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, FileText, Film, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
}

interface MediaSelectorProps {
  onSelect: (url: string) => void;
}

const MediaSelector = ({ onSelect }: MediaSelectorProps) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("media")
      .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    
    if (error) {
      toast({ title: "Error fetching files", description: error.message, variant: "destructive" });
    } else {
      setFiles((data as MediaFile[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      const name = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("media").upload(name, file);
      if (error) {
        toast({ title: `Failed to upload ${file.name}`, description: error.message, variant: "destructive" });
      }
    }
    setUploading(false);
    fetchFiles();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': [], 'video/*': [], 'application/pdf': []} });

  const getUrl = (name: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(name);
    return data.publicUrl;
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(name);
  const isVideo = (name: string) => /\.(mp4|webm|mov|avi)$/i.test(name);

  const filtered = files.filter((f) => 
    f.name !== ".emptyFolderPlaceholder" && 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
        <input {...getInputProps()} />
        <p className="text-sm text-muted-foreground">{isDragActive ? "Drop files here" : "Drag & drop files here, or click to select"}</p>
      </div>

      <Input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 h-64 overflow-y-auto">
          {filtered.map((file) => (
            <button key={file.id ?? file.name} onClick={() => onSelect(getUrl(file.name))} className="group relative aspect-square flex items-center justify-center bg-muted/50 rounded overflow-hidden border border-border hover:ring-2 hover:ring-primary">
              {isImage(file.name) ? (
                <img src={getUrl(file.name)} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
              ) : isVideo(file.name) ? (
                <Film className="h-8 w-8 text-muted-foreground" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100">
                <Check className="h-6 w-6 text-primary" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaSelector;
