interface BadgeProps {
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  size = "md",
  children,
}: BadgeProps) {
  const variantStyles = {
    default: "bg-muted text-muted-foreground border-transparent",
    primary: "bg-primary/10 text-primary border-primary/20",
    success:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    warning:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    outline: "bg-transparent text-foreground border-border",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1
        font-medium rounded-full border
        transition-colors
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {children}
    </span>
  );
}
