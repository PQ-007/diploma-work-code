"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, BarChart3, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import PollCreateDialog from "./PollCreateDialog";
import DiscussionCreateDialog from "./DiscussionCreateDialog";

export default function PostCreationBox() {
  const { t } = useLanguage();
  const router = useRouter();
  const [pollOpen, setPollOpen] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <Button
          size="sm"
          className="gap-1.5 text-xs font-medium"
          onClick={() => router.push("/article/create")}
        >
          <Pencil className="h-4 w-4" />
          {t("feed.postBox.post")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium"
          onClick={() => setPollOpen(true)}
        >
          <BarChart3 className="h-4 w-4" />
          {t("feed.postBox.poll")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium"
          onClick={() => setDiscussionOpen(true)}
        >
          <MessageSquare className="h-4 w-4" />
          {t("feed.postBox.discussion")}
        </Button>
      </div>

      <PollCreateDialog open={pollOpen} onOpenChange={setPollOpen} />
      <DiscussionCreateDialog
        open={discussionOpen}
        onOpenChange={setDiscussionOpen}
      />
    </>
  );
}
