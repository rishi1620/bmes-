import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Trash2, Copy, Image as ImageIcon, FileText, Film, Loader2, CheckSquare, Square, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "../../components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
}

const AdminMedia = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  const fetchFiles = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    let successCount = 0;
    
    for (const file of acceptedFiles) {
      const name = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("media").upload(name, file);
      if (error) {
        toast({ title: `Failed to upload ${file.name}`, description: error.message, variant: "destructive" });
      } else {
        successCount++;
      }
    }
    
    setUploading(false);
    toast({ title: `${successCount} file(s) uploaded` });
    fetchFiles();
  }, [fetchFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, accept: {'image/*': [], 'video/*': [], 'application/pdf': []} });

  const toggleSelect = (name: string) => {
    const next = new Set(selectedFiles);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedFiles(next);
  };

  const deleteSelected = async () => {
    setUploading(true);
    const filesToDelete = Array.from(selectedFiles);
    const { error } = await supabase.storage.from("media").remove(filesToDelete);
    
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Files deleted successfully" });
      setSelectedFiles(new Set());
      fetchFiles();
    }
    setUploading(false);
    setIsDeleteAllOpen(false);
  };

  const remove = async (name: string) => {
    console.log("Attempting to delete file:", name);
    const { data, error } = await supabase.storage.from("media").remove([name]);
    
    if (error) {
      console.error("Full Supabase Error Object:", error);
      toast({ 
        title: "Delete failed", 
        description: `Error: ${error.message} (Code: ${error.name})`, 
        variant: "destructive" 
      });
    } else {
      console.log("Delete successful:", data);
      toast({ title: "File deleted successfully" });
      fetchFiles();
    }
    setFileToDelete(null);
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

  const filtered = files.filter((f) => 
    f.name !== ".emptyFolderPlaceholder" && 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.2 } }
  };

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading || uploading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {selectedFiles.size > 0 && (
            <Button onClick={() => setIsDeleteAllOpen(true)} variant="destructive" size="sm" disabled={uploading}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected ({selectedFiles.size})
            </Button>
          )}
          <Button onClick={open} size="sm" disabled={uploading}>
            <Upload className="mr-1.5 h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div 
          {...getRootProps()} 
          className={`mb-6 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
        >
          <input {...getInputProps()} />
          <p className="text-muted-foreground">{isDragActive ? "Drop files here" : "Drag & drop files here, or click to select"}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Input placeholder="Search files…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 text-muted-foreground"
        >
          <ImageIcon className="mb-3 h-10 w-10" />
          <p>No media files yet.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {filtered.map((file) => (
            <motion.div variants={itemVariants} key={file.id ?? file.name} className={`group relative rounded-lg border border-border bg-card overflow-hidden ${selectedFiles.has(file.name) ? 'ring-2 ring-primary' : ''}`}>
              <div className="absolute top-2 left-2 z-10">
                <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/50" onClick={() => toggleSelect(file.name)}>
                  {selectedFiles.has(file.name) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                </Button>
              </div>
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
                <Button variant="outline" size="sm" onClick={() => setFileToDelete(file.name)} title="Delete" className="text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {fileToDelete}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => fileToDelete && remove(fileToDelete)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedFiles.size} file(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelected}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMedia;
