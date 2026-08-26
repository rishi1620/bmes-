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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  alt_text: string | null;
}

const AdminMedia = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video" | "pdf">("all");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set()); // IDs now
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [editingAlt, setEditingAlt] = useState<{ id: string, text: string } | null>(null);

  const fetchFiles = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    let successCount = 0;
    
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
      if (!userData.user) {
        toast({ title: "Error", description: "You must be logged in to upload files.", variant: "destructive" });
        setUploading(false);
        return;
      }
      const { error: dbError } = await supabase.from("media_library").insert({
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: userData.user.id,
      });

      if (dbError) {
        toast({ title: `Failed to register ${file.name} in database`, description: dbError.message, variant: "destructive" });
        // Cleanup storage if DB fails? Maybe not strictly necessary but good practice
        await supabase.storage.from("media").remove([fileName]);
      } else {
        successCount++;
      }
    }
    
    setUploading(false);
    if (successCount > 0) {
      toast({ title: `${successCount} file(s) uploaded` });
      fetchFiles();
    }
  }, [fetchFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop, 
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'], 
      'video/*': ['.mp4', '.webm', '.mov', '.avi'], 
      'application/pdf': ['.pdf']
    } 
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedFiles);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFiles(next);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filtered.length && filtered.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filtered.map(f => f.id)));
    }
  };

  const deleteSelected = async () => {
    setUploading(true);
    const idsToDelete = Array.from(selectedFiles);
    const filesToDelete = files.filter(f => idsToDelete.includes(f.id));
    const storageNames = filesToDelete.map(f => f.file_name);

    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage.from("media").remove(storageNames);
    
    if (storageError) {
      toast({ title: "Storage delete failed", description: storageError.message, variant: "destructive" });
    } else {
      // 2. Delete from Database
      const { error: dbError } = await supabase.from("media_library").delete().in("id", idsToDelete);
      
      if (dbError) {
        toast({ title: "Database delete failed", description: dbError.message, variant: "destructive" });
      } else {
        toast({ title: "Files deleted successfully" });
        setSelectedFiles(new Set());
        fetchFiles();
      }
    }
    setUploading(false);
    setIsDeleteAllOpen(false);
  };

  const remove = async (file: MediaFile) => {
    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage.from("media").remove([file.file_name]);
    
    if (storageError) {
      toast({ title: "Storage delete failed", description: storageError.message, variant: "destructive" });
    } else {
      // 2. Delete from Database
      const { error: dbError } = await supabase.from("media_library").delete().eq("id", file.id);
      
      if (dbError) {
        toast({ title: "Database delete failed", description: dbError.message, variant: "destructive" });
      } else {
        toast({ title: "File deleted successfully" });
        fetchFiles();
      }
    }
    setFileToDelete(null);
  };

  const updateAltText = async () => {
    if (!editingAlt) return;
    const { error } = await supabase
      .from("media_library")
      .update({ alt_text: editingAlt.text })
      .eq("id", editingAlt.id);
    
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Alt text updated" });
      fetchFiles();
    }
    setEditingAlt(null);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied to clipboard" });
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(name);
  const isVideo = (name: string) => /\.(mp4|webm|mov|avi)$/i.test(name);

  const filtered = files.filter((f) => {
    const matchesSearch = f.file_name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === "all") return true;
    if (filterType === "image") return isImage(f.file_name);
    if (filterType === "video") return isVideo(f.file_name);
    if (filterType === "pdf") return f.file_name.toLowerCase().endsWith(".pdf");
    return true;
  });

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
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4"
      >
        <Input placeholder="Search files…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="max-w-sm" />
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "all" | "image" | "video" | "pdf")}
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="pdf">PDFs</option>
          </select>
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedFiles.size === filtered.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>
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
            <motion.div variants={itemVariants} key={file.id} className={`group relative rounded-lg border border-border bg-card overflow-hidden ${selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''}`}>
              <div className="absolute top-2 left-2 z-10">
                <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/50" onClick={() => toggleSelect(file.id)}>
                  {selectedFiles.has(file.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                </Button>
              </div>
              <div className="aspect-square flex items-center justify-center bg-muted/50">
                {isImage(file.file_name) ? (
                  <img src={file.file_url} alt={file.alt_text || file.file_name} className="h-full w-full object-cover" loading="lazy" />
                ) : isVideo(file.file_name) ? (
                  <Film className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-foreground">{file.file_name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(file.file_size || 0)}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="outline" size="sm" onClick={() => copyUrl(file.file_url)} title="Copy URL"><Copy className="h-4 w-4" /></Button>
                {isImage(file.file_name) && (
                  <Button variant="outline" size="sm" onClick={() => setEditingAlt({ id: file.id, text: file.alt_text || "" })} title="Edit Alt Text"><FileText className="h-4 w-4" /></Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setFileToDelete(file)} title="Delete" className="text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4" /></Button>
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
            This will permanently delete {fileToDelete?.file_name}.
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

      <Dialog open={!!editingAlt} onOpenChange={() => setEditingAlt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alt Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input 
                value={editingAlt?.text || ""} 
                onChange={(e) => setEditingAlt(prev => prev ? { ...prev, text: e.target.value } : null)} 
                placeholder="Describe the image..."
              />
              <p className="text-xs text-muted-foreground">Alt text improves accessibility and SEO.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAlt(null)}>Cancel</Button>
            <Button onClick={updateAltText}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMedia;
