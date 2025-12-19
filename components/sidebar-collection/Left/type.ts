
// Enhanced tree data interface
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
}

export interface LibrarySubItem {
  id: string;
  nameKey: string;
  href: string;
}

export interface LibraryItem {
  nameKey: string;
  icon: React.ComponentType<{ className?: string }>;
  items: LibrarySubItem[];
}

export interface SidebarData {
  navMain: NavItem[];
  navLibrary: LibraryItem[];
}