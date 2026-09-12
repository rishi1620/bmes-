import { useState, useEffect, useCallback } from "react";
import { Trash, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";

interface ResourceManagementProps {
  settings: Record<string, string>;
  updateSetting: (key: string, value: string) => void;
}

export const ResourceManagement = ({ settings, updateSetting }: ResourceManagementProps) => {
  const resourceSemesters = JSON.parse(settings.portal_resource_semesters_json || "{}");
  const [newSemester, setNewSemester] = useState("");
  const [semesters, setSemesters] = useState<string[]>([
    "All Semesters",
    "Level-1 Term-1", "Level-1 Term-2", 
    "Level-2 Term-1", "Level-2 Term-2", 
    "Level-3 Term-1", "Level-3 Term-2", 
    "Level-4 Term-1", "Level-4 Term-2"
  ]);
  const [mediaFiles, setMediaFiles] = useState<{ id: string; name: string }[]>([]);

  const fetchMedia = useCallback(async () => {
    const { data } = await supabase.storage.from("resources").list();
    if (data) setMediaFiles(data.filter(f => f.name !== ".emptyFolderPlaceholder"));
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const updateResourceSemester = (fileName: string, semester: string) => {
    const newSemesters = { ...resourceSemesters, [fileName]: semester };
    updateSetting("portal_resource_semesters_json", JSON.stringify(newSemesters));
  };

  const deleteFile = async (fileName: string) => {
    const { error } = await supabase.storage.from("resources").remove([fileName]);
    if (error) {
      toast({ title: "Error deleting file", variant: "destructive" });
    } else {
      toast({ title: "File deleted" });
      fetchMedia();
    }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { error } = await supabase.storage.from("resources").upload(file.name, file);
    if (error) {
      toast({ title: "Error uploading file", variant: "destructive" });
    } else {
      toast({ title: "File uploaded" });
      fetchMedia();
    }
  };

  const addSemester = () => {
    if (newSemester && !semesters.includes(newSemester)) {
      setSemesters([...semesters, newSemester]);
      setNewSemester("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resource Semesters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="New Semester Name" 
            value={newSemester} 
            onChange={e => setNewSemester(e.target.value)} 
          />
          <Button onClick={addSemester}>Add Semester</Button>
        </div>
        <div className="flex gap-2">
          <Label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md">
            Upload File
            <input type="file" className="hidden" onChange={uploadFile} />
          </Label>
        </div>
        {semesters.map(semester => {
          const semesterFiles = mediaFiles.filter(f => (resourceSemesters[f.name] || "all") === (semester === "All Semesters" ? "all" : semester));
          const images = semesterFiles.filter(f => f.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i));
          const pdfs = semesterFiles.filter(f => f.name.match(/\.(pdf)$/i));
          const others = semesterFiles.filter(f => !f.name.match(/\.(jpg|jpeg|png|gif|svg|webp|pdf)$/i));

          return (
            <Collapsible key={semester} className="border rounded-md">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 font-semibold bg-slate-100 dark:bg-slate-800">
                {semester}
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 space-y-4">
                {images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Images</h4>
                    {images.map(file => (
                      <div key={file.id} className="flex items-center justify-between gap-4 p-2 border rounded-md bg-slate-50/30 dark:bg-slate-900/30 mb-1">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <select 
                          className="text-sm border rounded p-1 bg-background/50"
                          value={resourceSemesters[file.name] || "all"}
                          onChange={(e) => updateResourceSemester(file.name, e.target.value)}
                        >
                          <option value="all">All Semesters</option>
                          {semesters.filter(s => s !== "All Semesters").map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <Button variant="destructive" size="icon" onClick={() => deleteFile(file.name)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {pdfs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">PDFs</h4>
                    {pdfs.map(file => (
                      <div key={file.id} className="flex items-center justify-between gap-4 p-2 border rounded-md bg-slate-50/30 dark:bg-slate-900/30 mb-1">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <select 
                          className="text-sm border rounded p-1 bg-background/50"
                          value={resourceSemesters[file.name] || "all"}
                          onChange={(e) => updateResourceSemester(file.name, e.target.value)}
                        >
                          <option value="all">All Semesters</option>
                          {semesters.filter(s => s !== "All Semesters").map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <Button variant="destructive" size="icon" onClick={() => deleteFile(file.name)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {others.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Others</h4>
                    {others.map(file => (
                      <div key={file.id} className="flex items-center justify-between gap-4 p-2 border rounded-md bg-slate-50/30 dark:bg-slate-900/30 mb-1">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <select 
                          className="text-sm border rounded p-1 bg-background/50"
                          value={resourceSemesters[file.name] || "all"}
                          onChange={(e) => updateResourceSemester(file.name, e.target.value)}
                        >
                          <option value="all">All Semesters</option>
                          {semesters.filter(s => s !== "All Semesters").map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <Button variant="destructive" size="icon" onClick={() => deleteFile(file.name)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};
