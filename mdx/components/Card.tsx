import { type LucideIcon } from "lucide-react";
import { getIcon, type IconName } from "./iconMap";

interface CardProps {
  title?: string;
  icon?: LucideIcon | IconName | string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  children: React.ReactNode;
  href?: string;
}

export function Card({
  title,
  icon,
  variant = "default",
  children,
  href,
}: CardProps) {
  const Icon = icon ? getIcon(icon) : null;
  const variantStyles = {
    default: "border-border hover:border-muted-foreground",
    primary: "border-primary/30 bg-primary/5 hover:border-primary",
    success: "border-green-500/30 bg-green-500/5 hover:border-green-500",
    warning: "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500",
    danger: "border-red-500/30 bg-red-500/5 hover:border-red-500",
  };

  const CardWrapper = href ? "a" : "div";

  return (
    <CardWrapper
      href={href}
      className={`
        my-6 rounded-xl border bg-card p-6 shadow-md
        transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
        ${variantStyles[variant]}
        ${href ? "cursor-pointer" : ""}
      `}
    >
      {(title || Icon) && (
        <div className="flex items-center gap-3 mb-4">
          {Icon && (
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          {title && (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          )}
        </div>
      )}
      <div className="prose prose-sm max-w-none text-muted-foreground">
        {children}
      </div>
    </CardWrapper>
  );
}
