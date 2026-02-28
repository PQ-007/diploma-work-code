// components/ArticleCreateHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageToggleButton } from "../button-collection/LanguageSwitcherButton";
import ThemeToggleButton from "../button-collection/ThemeToggleButton";
import { NavUser } from "../NavUser";

// --- ArticleCreateHeader Main Component ---

export function ArticleCreateHeader() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleBack = () => router.back();

  const handleSaveDraft = () => {
    if (isSaving || isPublishing) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }, 800);
  };

  const handlePublish = () => {
    if (isPublishing || isSaving) return;
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      // TODO: plug real publish flow
    }, 1200);
  };

  return (
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center border-b bg-background/95 px-4 transition-all ease-linear supports-[backdrop-filter]:backdrop-blur-sm">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
       
      
          
        </div>

        <div className="flex items-center gap-2 text-sm font-medium">
          

          

          <div className="h-6 w-px bg-border mx-1" aria-hidden />

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>{justSaved ? "Saved" : "Save draft"}</span>
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handlePublish}
            disabled={isPublishing || isSaving}
          >
            {isPublishing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>{isPublishing ? "Publishing" : "Publish"}</span>
          </Button>
          <NavUser />
        </div>
      </div>
    </header>
  );
}
