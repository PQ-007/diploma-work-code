// Icon mapping for server-side icon resolution
import {
  Zap,
  Shield,
  Rocket,
  Database,
  Globe,
  Code2,
  Palette,
  Check,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Terminal,
  Lock,
  Cpu,
  Cloud,
  Star,
  Heart,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Settings,
  Package,
  type LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  // Common icons
  zap: Zap,
  shield: Shield,
  rocket: Rocket,
  database: Database,
  globe: Globe,
  code: Code2,
  palette: Palette,
  check: Check,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  alert: AlertCircle,
  terminal: Terminal,
  lock: Lock,
  cpu: Cpu,
  cloud: Cloud,
  star: Star,
  heart: Heart,
  trophy: Trophy,
  target: Target,
  trending: TrendingUp,
  users: Users,
  settings: Settings,
  package: Package,
};

export type IconName = keyof typeof iconMap;

export function getIcon(iconOrName: LucideIcon | IconName | string): LucideIcon | null {
  // If it's already a component, return it
  if (typeof iconOrName === "function") {
    return iconOrName as LucideIcon;
  }

  // If it's a string, look it up in the map
  if (typeof iconOrName === "string") {
    return iconMap[iconOrName.toLowerCase()] || null;
  }

  return null;
}
