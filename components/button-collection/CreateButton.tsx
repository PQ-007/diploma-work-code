"use client";

import Link from "next/link";
import { Blocks, FileText, FolderGit2, MessageSquare, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const options = [
  { href: "/article/create", icon: FileText, label: "create_button.article", desc: "create_button.article_disc" },
  { href: "/project/create", icon: FolderGit2, label: "create_button.project", desc: "create_button.project_disc" },
  { href: "/dictionary/create", icon: Blocks, label: "create_button.dictionary", desc: "create_button.dictionary_disc" },
  { href: "/discussions?create=1", icon: MessageSquare, label: "create_button.discussions", desc: "create_button.discussions_disc" },
];

export default function CreateButton() {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 rounded-full px-3 sm:px-4" aria-label={t("create_button.create")}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("create_button.create")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1.5">
        {options.map((o) => (
          <DropdownMenuItem key={o.href} asChild className="cursor-pointer gap-3 rounded-md px-2.5 py-2">
            <Link href={o.href}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <o.icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{t(o.label)}</span>
                <span className="truncate text-xs text-muted-foreground">{t(o.desc)}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
