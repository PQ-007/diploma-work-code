import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
} from "lucide-react";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
}

export function Alert({ variant = "info", title, children }: AlertProps) {
  const config = {
    info: {
      icon: Info,
      containerClass: "bg-blue-500/10 border-blue-500/30",
      iconClass: "text-blue-500",
      titleClass: "text-blue-700 dark:text-blue-400",
    },
    success: {
      icon: CheckCircle,
      containerClass: "bg-green-500/10 border-green-500/30",
      iconClass: "text-green-500",
      titleClass: "text-green-700 dark:text-green-400",
    },
    warning: {
      icon: AlertTriangle,
      containerClass: "bg-yellow-500/10 border-yellow-500/30",
      iconClass: "text-yellow-500",
      titleClass: "text-yellow-700 dark:text-yellow-400",
    },
    error: {
      icon: XCircle,
      containerClass: "bg-red-500/10 border-red-500/30",
      iconClass: "text-red-500",
      titleClass: "text-red-700 dark:text-red-400",
    },
  };

  const style = config[variant];
  const Icon = style.icon;

  return (
    <div
      className={`
        my-6 rounded-xl border p-5 shadow-sm
        ${style.containerClass}
      `}
      role="alert"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${style.iconClass}`} />
        </div>
        <div className="flex-1">
          {title && (
            <div className={`font-semibold mb-2 ${style.titleClass}`}>
              {title}
            </div>
          )}
          <div className="prose prose-sm max-w-none text-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
