import { Sparkles } from "lucide-react";

interface AdventBannerProps {
  t: (key: string) => string; // Simple type for translation function
}

export default function AdventBanner({
  t,
}: AdventBannerProps) {
  return (
    <div className="mb-8 p-4 rounded-lg border border-border/40">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-foreground">
            {t("common.welcome")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("common.moto")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}