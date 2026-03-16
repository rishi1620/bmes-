import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function NowCard() {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-none">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Zap className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Currently</span>
          <span className="text-sm font-medium text-foreground">Building the future of BMES</span>
        </div>
      </CardContent>
    </Card>
  );
}
