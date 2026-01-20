export function Callout({
  children,
  type = "note",
}: {
  children: React.ReactNode;
  type?: "note" | "warning" | "tip" | "info" | "danger";
}) {
  const config = {
    note: {
      icon: "📝",
      containerClass: "border-blue-500/40 bg-blue-500/10",
      iconBgClass: "bg-blue-500/20",
      textClass: "text-blue-700 dark:text-blue-400",
    },
    info: {
      icon: "ℹ️",
      containerClass: "border-blue-500/40 bg-blue-500/10",
      iconBgClass: "bg-blue-500/20",
      textClass: "text-blue-700 dark:text-blue-400",
    },
    warning: {
      icon: "⚠️",
      containerClass: "border-yellow-500/40 bg-yellow-500/10",
      iconBgClass: "bg-yellow-500/20",
      textClass: "text-yellow-800 dark:text-yellow-400",
    },
    tip: {
      icon: "💡",
      containerClass: "border-green-500/40 bg-green-500/10",
      iconBgClass: "bg-green-500/20",
      textClass: "text-green-800 dark:text-green-400",
    },
    danger: {
      icon: "🚨",
      containerClass: "border-red-500/40 bg-red-500/10",
      iconBgClass: "bg-red-500/20",
      textClass: "text-red-800 dark:text-red-400",
    },
  };

  const style = config[type];

  return (
    <div
      className={`my-8 rounded-xl border-l-4 p-6 shadow-sm ${style.containerClass}`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 rounded-lg p-2 ${style.iconBgClass}`}>
          <span className="text-2xl">{style.icon}</span>
        </div>
        <div className={`flex-1 prose prose-sm max-w-none ${style.textClass}`}>
          {children}
        </div>
      </div>
    </div>
  );
}