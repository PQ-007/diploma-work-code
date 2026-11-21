import {
  Anvil,
  Briefcase,
  GraduationCap,
  Hammer,
  House,
  MessagesSquare,
  Store,
  Telescope,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  titleKey: string;
  /** Shorter label for the phone bottom nav (5 items share 360px), when the full one doesn't fit. */
  shortTitleKey?: string;
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
    shortTitleKey: "sidebar.short.projects",
    href: "/project",
    icon: Anvil,
    items: [
      { titleKey: "sidebar.graduation", href: "/project?type=diploma", icon: GraduationCap },
      { titleKey: "sidebar.contest", href: "/project?type=contest", icon: Hammer },
      { titleKey: "sidebar.internship", href: "/project?type=internship", icon: Briefcase },
    ],
  },
  { titleKey: "sidebar.competitions", shortTitleKey: "sidebar.short.competitions", href: "/competition", icon: Trophy },
  { titleKey: "sidebar.discussions", shortTitleKey: "sidebar.short.discussions", href: "/discussions", icon: MessagesSquare },
];

/** Announced but not built yet; shown muted in the sidebar only. */
export const comingSoonNav: NavLink[] = [
  { titleKey: "sidebar.store", href: "/store", icon: Store },
];

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  const base = href.split("?")[0];
  return base === "/" ? pathname === "/" : pathname === base || pathname.startsWith(`${base}/`);
}

/** The nav entry the current page belongs to (used for the header's section label). */
export function findSection(pathname: string | null): NavLink | undefined {
  return [...primaryNav, ...comingSoonNav].find((item) => isActivePath(pathname, item.href));
}
