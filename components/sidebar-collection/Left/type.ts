import type { FeatureFlag } from "@/lib/featureFlags";

// Tree data interface
export interface EnhancedTreeNode {
  key: string;
  title: React.ReactNode;
  children?: EnhancedTreeNode[];
  type?: "folder" | "file";
  fileType?: "text" | "image" | "code" | "video" | "audio" | "other";
  size?: string;
  modified?: string;
}

export interface TreeViewProps {
  showQuickActions?: boolean;
  activeSection?: string;
}

// Type definitions
export interface NavSubItem {
  titleKey: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavItem {
  titleKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  items?: NavSubItem[];
  authRequired?: boolean;
  /** Hidden unless the matching feature flag is enabled (parked features). */
  flag?: FeatureFlag;
}

export interface LibrarySubItem {
  id: string;
  nameKey: string;
  href: string;
}



export interface SidebarData {
  navMain: NavItem[];

}
