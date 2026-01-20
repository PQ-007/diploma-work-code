import { Check, Terminal } from "lucide-react";

export const ProTip = ({ children }: { children: React.ReactNode }) => (
  <div className="not-prose my-10 bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10">
      <Terminal className="w-24 h-24 text-primary" />
    </div>
    <h4 className="flex items-center gap-2 font-bold text-primary mb-2">
      <Check className="w-5 h-5" />
      Pro Tip
    </h4>
    <div className="text-muted-foreground relative z-10">{children}</div>
  </div>
);