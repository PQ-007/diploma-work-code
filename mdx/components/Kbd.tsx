interface KbdProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Kbd({ children, size = "md" }: KbdProps) {
  const sizeStyles = {
    sm: "text-xs px-1.5 py-0.5 min-w-[20px]",
    md: "text-sm px-2 py-1 min-w-[24px]",
    lg: "text-base px-3 py-1.5 min-w-[32px]",
  };

  // Split on + to show multiple keys
  const keys = String(children).split("+");

  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="inline-flex items-center gap-1">
          <kbd
            className={`
              inline-flex items-center justify-center
              font-mono font-semibold
              bg-muted text-foreground
              border border-border rounded-md
              shadow-sm
              ${sizeStyles[size]}
            `}
          >
            {key.trim()}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-muted-foreground text-xs">+</span>
          )}
        </span>
      ))}
    </span>
  );
}
