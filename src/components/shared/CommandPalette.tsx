import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Sun, Moon, Laptop, Copy, Home, Info, FlaskConical } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ui/use-toast";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <Home className="mr-2 h-4 w-4" /> Home
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/about"))}>
            <Info className="mr-2 h-4 w-4" /> About
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/projects"))}>
            <FlaskConical className="mr-2 h-4 w-4" /> Projects
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" /> Light Mode
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" /> Dark Mode
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" /> System Theme
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => {
            navigator.clipboard.writeText("contact@example.com");
            toast({ title: "Email copied to clipboard" });
          })}>
            <Copy className="mr-2 h-4 w-4" /> Copy Email
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
