import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  Trash2, 
  Copy, 
  Image as ImageIcon, 
  FileText, 
  Film, 
  Loader2, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { storageService } from "@/services/storageService";
import { 
  fetchMedia, 
  batchFetchMedia, 
  verifyStorageBucketPolicies, 
  subscribeToMediaFetch,
  MediaFetchResult, 
  BucketPolicyVerification 
} from "@/lib/media-logger";
import { SafeImage } from "@/components/ui/SafeImage";
import { StorageDiagnosticsDialog } from "@/components/admin/StorageDiagnosticsDialog";
import AdminLayout from "../../components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [isProbing, setIsProbing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video" | "pdf" | "broken">("all");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set()); // IDs now
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [editingAlt, setEditingAlt] = useState<{ id: string, text: string } | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  
  // Media logger URL statuses and bucket verification state
  const [urlStatuses, setUrlStatuses] = useState<Record<string, MediaFetchResult>>({});
  const [bucketVerification, setBucketVerification] = useState<BucketPolicyVerification | null>(null);

  // Subscribe to reactive media fetch probe results
  useEffect(() => {
    const unsubscribe = subscribeToMediaFetch((res) => {
      setUrlStatuses(prev => ({ ...prev, [res.url]: res }));
    });
    return unsubscribe;
  }, []);

  const probeMediaUrls = useCallback(async (mediaFiles: MediaFile[]) => {
    if (!mediaFiles || mediaFiles.length === 0) return;
    setIsProbing(true);
    try {
      const urls = mediaFiles.map(f => f.file_url).filter(Boolean);
      const resultsMap = await batchFetchMedia(urls, { concurrency: 6 });
      const statusObj: Record<string, MediaFetchResult> = {};
      resultsMap.forEach((val, key) => {
        statusObj[key] = val;
      });
      setUrlStatuses(prev => ({ ...prev, ...statusObj }));
    } catch (e) {
      console.warn("[AdminMedia] Batch probing encountered an error:", e);
    } finally {
      setIsProbing(false);
    }
  }, []);

  const checkBucketHealth = useCallback(async () => {
    try {
      const verification = await verifyStorageBucketPolicies("media");
      setBucketVerification(verification);
    } catch (e) {
      console.warn("[AdminMedia] Bucket policy check error:", e);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error fetching files", description: error.message, variant: "destructive" });
      setLoading(false);
    } else {
      const fetched = (data as MediaFile[]) ?? [];
      setFiles(fetched);
      setLoading(false);
      
      // Probe media URLs and verify storage bucket policies via media-logger service
      probeMediaUrls(fetched);
      checkBucketHealth();
    }
  }, [probeMediaUrls, checkBucketHealth]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleVerifySingleUrl = async (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toast({ title: "Checking Media Link...", description: `Probing status for ${url}` });
    const res = await fetchMedia(url, { skipCache: true, context: "AdminMediaManualCheck" });
    setUrlStatuses(prev => ({ ...prev, [url]: res }));
    
    if (res.ok) {
      toast({ title: "Media Link Healthy", description: `HTTP ${res.status || 200} OK` });
    } else {
      toast({ 
        title: res.errorTitle || `HTTP ${res.status || 'Failed'} Error`, 
        description: res.errorMessage || "Unable to reach media asset", 
        variant: "destructive" 
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    let successCount = 0;
    
    for (const file of acceptedFiles) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      
      // 1. Upload to Storage via storageService layer with logging
      const uploadResult = await storageService.upload("media", fileName, file);
      
      if (uploadResult.error || !uploadResult.data) {
        toast({ 
          title: `Failed to upload ${file.name}`, 
          description: uploadResult.error?.message || "Storage upload failed. Check Supabase Storage permissions.", 
          variant: "destructive" 
        });
        continue;
      }

      // 2. Get Public URL
      const { publicUrl } = uploadResult.data;
      
      // 3. Create Database Record
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({ title: "Error", description: "You must be logged in to upload files.", variant: "destructive" });
        setUploading(false);
        return;
      }
      const { error: dbError } = await supabase.from("media_library").insert({
        file_name: fileName,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: userData.user.id,
      });

      if (dbError) {
        toast({ title: `Failed to register ${file.name} in database`, description: dbError.message, variant: "destructive" });
        // Cleanup storage if DB fails
        await storageService.remove("media", [fileName]);
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

    // 1. Delete from Storage via storageService
    const { error: storageError } = await storageService.remove("media", storageNames);
    
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
    // 1. Delete from Storage via storageService
    const { error: storageError } = await storageService.remove("media", [file.file_name]);
    
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

  const brokenCount = files.filter(f => urlStatuses[f.file_url] && !urlStatuses[f.file_url].ok).length;
  const is403Count = files.filter(f => urlStatuses[f.file_url]?.status === 403).length;
  const is404Count = files.filter(f => urlStatuses[f.file_url]?.status === 404).length;

  const filtered = files.filter((f) => {
    const matchesSearch = f.file_name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === "all") return true;
    if (filterType === "image") return isImage(f.file_name);
    if (filterType === "video") return isVideo(f.file_name);
    if (filterType === "pdf") return f.file_name.toLowerCase().endsWith(".pdf");
    if (filterType === "broken") return Boolean(urlStatuses[f.file_url] && !urlStatuses[f.file_url].ok);
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
      <TooltipProvider>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center justify-between flex-wrap gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage and trace Supabase storage assets, public bucket policies, and CDN health.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsDiagnosticsOpen(true)} 
              className={`gap-1.5 text-xs ${
                brokenCount > 0 || bucketVerification?.status === 'restricted'
                  ? 'border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20'
                  : 'border-primary/30 hover:bg-primary/10 text-primary'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Storage Diagnostics</span>
              {brokenCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px] leading-none">
                  {brokenCount} issue{brokenCount > 1 ? 's' : ''}
                </Badge>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                fetchFiles();
              }} 
              disabled={loading || uploading || isProbing} 
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading || isProbing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isProbing ? "Probing Links..." : "Refresh & Verify"}
              </span>
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

        {/* Storage Policy or Broken Link Banner */}
        {(brokenCount > 0 || bucketVerification?.status === 'restricted') && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg border border-destructive/30 bg-destructive/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-destructive/20 text-destructive shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <span>Storage Access & Link Status Alert</span>
                  {is403Count > 0 && <Badge variant="destructive" className="text-[10px] font-mono">{is403Count} 403 Forbidden</Badge>}
                  {is404Count > 0 && <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-mono">{is404Count} 404 Not Found</Badge>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bucketVerification?.status === 'restricted'
                    ? `Bucket 'media' public read permissions are restricted. Images will fail to render without public access.`
                    : `${brokenCount} media asset(s) are failing link verification probes.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilterType(filterType === 'broken' ? 'all' : 'broken')}
                className="text-xs h-8"
              >
                {filterType === 'broken' ? 'Show All Files' : `Filter Broken (${brokenCount})`}
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsDiagnosticsOpen(true)}
                className="text-xs h-8"
              >
                Fix in Diagnostics
              </Button>
            </div>
          </motion.div>
        )}

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
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
        >
          <div className="flex flex-1 items-center gap-2 max-w-md w-full">
            <Input placeholder="Search files…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="w-full" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | "image" | "video" | "pdf" | "broken")}
            >
              <option value="all">All Files ({files.length})</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="pdf">PDFs</option>
              <option value="broken">⚠️ Broken Links ({brokenCount})</option>
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
            <p>
              {filterType === 'broken' 
                ? "No broken links found! All probed media files are responding normally." 
                : "No media files found."}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {filtered.map((file) => {
              const probeStatus = urlStatuses[file.file_url];
              const isBroken = probeStatus && !probeStatus.ok;
              const is403 = probeStatus?.status === 403 || probeStatus?.errorType === '403_FORBIDDEN';
              const is404 = probeStatus?.status === 404 || probeStatus?.errorType === '404_NOT_FOUND';
              const is401 = probeStatus?.status === 401 || probeStatus?.errorType === '401_UNAUTHORIZED';

              return (
                <motion.div 
                  variants={itemVariants} 
                  key={file.id} 
                  className={`group relative rounded-lg border bg-card overflow-hidden transition-all ${
                    isBroken ? 'border-destructive/60 shadow-sm' : 'border-border'
                  } ${selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''}`}
                >
                  {/* Select Checkbox */}
                  <div className="absolute top-2 left-2 z-20">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 bg-background/80 backdrop-blur-sm shadow-sm" 
                      onClick={() => toggleSelect(file.id)}
                    >
                      {selectedFiles.has(file.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Broken Link Status Badge */}
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                    {probeStatus ? (
                      isBroken ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              {is403 ? (
                                <Badge variant="destructive" className="px-1.5 py-0.5 text-[9px] font-mono flex items-center gap-1 shadow">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  <span>403 Forbidden</span>
                                </Badge>
                              ) : is404 ? (
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white px-1.5 py-0.5 text-[9px] font-mono flex items-center gap-1 shadow">
                                  <AlertCircle className="h-2.5 w-2.5" />
                                  <span>404 Not Found</span>
                                </Badge>
                              ) : is401 ? (
                                <Badge variant="destructive" className="px-1.5 py-0.5 text-[9px] font-mono shadow">
                                  <span>401 Auth</span>
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="px-1.5 py-0.5 text-[9px] font-mono shadow">
                                  <span>Error</span>
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs text-xs space-y-1">
                            <p className="font-semibold text-destructive">{probeStatus.errorTitle || 'Media Error'}</p>
                            <p>{probeStatus.errorMessage || 'Link failed probe'}</p>
                            {probeStatus.remediation && (
                              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">{probeStatus.remediation}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Badge variant="outline" className="bg-background/90 text-emerald-600 border-emerald-300 dark:border-emerald-800 text-[9px] font-mono px-1 py-0 shadow-sm flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                <span>200 OK</span>
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Media URL is active and reachable ({probeStatus.durationMs}ms)
                          </TooltipContent>
                        </Tooltip>
                      )
                    ) : null}
                  </div>

                  {/* Media Visual Aspect */}
                  <div className="aspect-square flex items-center justify-center bg-muted/50 relative">
                    {isImage(file.file_name) ? (
                      <SafeImage 
                        src={file.file_url} 
                        alt={file.alt_text || file.file_name} 
                        className="h-full w-full object-cover" 
                        loading="lazy"
                        componentName="AdminMediaLibrary"
                      />
                    ) : isVideo(file.file_name) ? (
                      <Film className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* File Details & Status Message */}
                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-foreground">{file.file_name}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>{formatSize(file.file_size || 0)}</span>
                      {isBroken && (
                        <span className="text-destructive font-mono font-medium">
                          {probeStatus.status ? `HTTP ${probeStatus.status}` : 'Broken'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-background/85 backdrop-blur-[2px] opacity-0 transition-opacity group-hover:opacity-100 z-30">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleVerifySingleUrl(file.file_url, e)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Test Link Status</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => copyUrl(file.file_url)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Copy URL</TooltipContent>
                    </Tooltip>

                    {isImage(file.file_name) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingAlt({ id: file.id, text: file.alt_text || "" })}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Edit Alt Text</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setFileToDelete(file)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </TooltipProvider>

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

      <StorageDiagnosticsDialog 
        open={isDiagnosticsOpen} 
        onOpenChange={setIsDiagnosticsOpen} 
        defaultBucket="media"
      />
    </AdminLayout>
  );
};

export default AdminMedia;
