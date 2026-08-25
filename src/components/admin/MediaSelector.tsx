import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Film, Loader2, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fileToDataUrl, fetchUnifiedMediaFiles } from "@/lib/media";
import LazyImage from "@/components/shared/LazyImage";

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

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const unified = await fetchUnifiedMediaFiles();
      setFiles(unified);
    } catch (err) {
      toast({ title: "Error fetching files", description: String(err), variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    let successCount = 0;

    for (const file of acceptedFiles) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      let finalUrl = "";

      // 1. Read data URL as a guaranteed local fallback
      const dataUrl = await fileToDataUrl(file);

      // 2. Upload to Storage
      const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file);

      // 3. Get Public URL
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);

      if (!uploadError && urlData?.publicUrl && !urlData.publicUrl.includes("placeholder-project.supabase.co") && !urlData.publicUrl.includes("placeholder-supabase-url")) {
        finalUrl = urlData.publicUrl;
      } else {
        finalUrl = dataUrl || urlData?.publicUrl || "";
      }

      // Cache the file locally for mock storage if needed
      if (dataUrl) {
        try {
          localStorage.setItem(`mock_storage_file_${fileName}`, dataUrl);
        } catch {
          // ignore
        }
      }

      // 4. Create Database Record
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || "00000000-0000-0000-0000-000000000001";

      const { error: dbError } = await supabase.from("media_library").insert({
        file_name: fileName,
        file_url: finalUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: userId,
      });

      if (dbError) {
        toast({ title: `Failed to register ${file.name}`, description: dbError.message, variant: "destructive" });
      } else {
        successCount++;
      }
    }
    setUploading(false);
    if (successCount > 0) {
      toast({ title: `${successCount} file(s) uploaded successfully` });
      fetchFiles();
    }
  }, [fetchFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'], 
      'video/*': ['.mp4', '.webm', '.mov', '.avi'], 
      'application/pdf': ['.pdf']
    } 
  });

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(name) || name.startsWith("data:image");
  const isVideo = (name: string) => /\.(mp4|webm|mov|avi)$/i.test(name);

  const filtered = files.filter((f) => 
    f.file_name.toLowerCase().includes(search.toLowerCase()) ||
    (f.alt_text && f.alt_text.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
        <input {...getInputProps()} />
        <p className="text-sm text-muted-foreground">{isDragActive ? "Drop files here" : uploading ? "Uploading..." : "Drag & drop files here, or click to select"}</p>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Button variant="outline" size="icon" onClick={fetchFiles} disabled={loading} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg text-muted-foreground">
          <p>No media files found.</p>
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 max-h-72 overflow-y-auto p-1">
          {filtered.map((file) => (
            <button
              type="button"
              key={file.id}
              onClick={() => onSelect(file.file_url)}
              className="group relative aspect-square flex items-center justify-center bg-muted/50 rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-primary focus:outline-none"
            >
              {isImage(file.file_name) ? (
                <LazyImage
                  src={file.file_url}
                  alt={file.alt_text || file.file_name}
                  className="h-full w-full object-cover"
                  containerClassName="h-full w-full"
                />
              ) : isVideo(file.file_name) ? (
                <Film className="h-8 w-8 text-muted-foreground" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Check className="h-6 w-6 text-primary-foreground drop-shadow" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaSelector;
