import {
  Anvil,
  Blocks,
  Briefcase,
  GraduationCap,
  Hammer,
  House,
  MessagesSquare,
  Scroll,
  Store,
  Telescope,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  /** Sub-links shown under the item in the sidebar. */
  items?: NavLink[];
}

/** Primary destinations: sidebar on desktop, bottom tab bar on phones. */
export const primaryNav: NavLink[] = [
  { titleKey: "sidebar.home", href: "/", icon: House },
  { titleKey: "sidebar.articles", href: "/article", icon: Telescope },
  {
    titleKey: "sidebar.projects",
    href: "/project",
    icon: Anvil,
    // Filters on the project_type enum (the DB spells it "intership").
    items: [
      { titleKey: "sidebar.graduation", href: "/project?type=diploma", icon: GraduationCap },
      { titleKey: "sidebar.contest", href: "/project?type=contest", icon: Hammer },
      { titleKey: "sidebar.internship", href: "/project?type=intership", icon: Briefcase },
    ],
  },
  { titleKey: "sidebar.dictionary", href: "/dictionary", icon: Blocks },
  { titleKey: "sidebar.discussions", href: "/discussions", icon: MessagesSquare },
];

/** Announced but not built yet; shown muted in the sidebar only. */
export const comingSoonNav: NavLink[] = [
  { titleKey: "sidebar.knowledgeTree", href: "/knowledge-tree", icon: Scroll },
  { titleKey: "sidebar.store", href: "/store", icon: Store },
];

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  const base = href.split("?")[0];
  return base === "/" ? pathname === "/" : pathname === base || pathname.startsWith(`${base}/`);
}
