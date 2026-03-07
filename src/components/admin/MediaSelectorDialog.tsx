import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MediaSelector from "./MediaSelector";
import { useState } from "react";

interface MediaSelectorDialogProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
}

const MediaSelectorDialog = ({ onSelect, trigger }: MediaSelectorDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Select from Media</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select from Media</DialogTitle>
        </DialogHeader>
        <MediaSelector onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelectorDialog;
