import { Download, Trash2, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const QuickActions = () => (
  <div className="rounded-lg border bg-card p-4">
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-1.5">
        <Download className="h-3.5 w-3.5" />
        Export Chat
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
        Clear History
      </Button>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="gap-1.5">
        <Settings className="h-3.5 w-3.5" />
        Settings
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5">
        <HelpCircle className="h-3.5 w-3.5" />
        Help
      </Button>
    </div>
  </div>
);

export default QuickActions;
