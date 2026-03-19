import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Film, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  alt_text: string | null;
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
    const { data, error } = await supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false });
    
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
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      
      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file);
      
      if (uploadError) {
        toast({ title: `Failed to upload ${file.name}`, description: uploadError.message, variant: "destructive" });
        continue;
      }

      // 2. Get Public URL
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
      
      // 3. Create Database Record
      const { data: userData } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from("media_library").insert({
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: userData.user?.id,
      });

      if (dbError) {
        toast({ title: `Failed to register ${file.name} in database`, description: dbError.message, variant: "destructive" });
        await supabase.storage.from("media").remove([fileName]);
      }
    }
    setUploading(false);
    fetchFiles();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': [], 'video/*': [], 'application/pdf': []} });

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(name);
  const isVideo = (name: string) => /\.(mp4|webm|mov|avi)$/i.test(name);

  const filtered = files.filter((f) => 
    f.file_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
        <input {...getInputProps()} />
        <p className="text-sm text-muted-foreground">{isDragActive ? "Drop files here" : uploading ? "Uploading..." : "Drag & drop files here, or click to select"}</p>
      </div>

      <Input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 h-64 overflow-y-auto">
          {filtered.map((file) => (
            <button key={file.id} onClick={() => onSelect(file.file_url)} className="group relative aspect-square flex items-center justify-center bg-muted/50 rounded overflow-hidden border border-border hover:ring-2 hover:ring-primary">
              {isImage(file.file_name) ? (
                <img src={file.file_url} alt={file.alt_text || file.file_name} className="h-full w-full object-cover" loading="lazy" />
              ) : isVideo(file.file_name) ? (
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
