import { Quote as QuoteIcon } from "lucide-react";

interface QuoteProps {
  children: React.ReactNode;
  author?: string;
  role?: string;
  avatar?: string;
}

export function Quote({ children, author, role, avatar }: QuoteProps) {
  return (
    <div className="my-8 relative">
      {/* Quote icon */}
      <div className="absolute -top-2 -right-0 text-primary/20">
        <QuoteIcon className="w-12 h-12 fill-current" />
      </div>

      {/* Quote content */}
      <div
        className="relative rounded-lg border-l-4 border-primary bg-muted/30
                   p-6 pl-8 shadow-sm"
      >
        <div className="prose prose-sm max-w-none text-foreground italic mb-4">
          {children}
        </div>

        {/* Author info */}
        {(author || role) && (
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            {avatar && (
              <img
                src={avatar}
                alt={author}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              {author && (
                <div className="font-semibold text-foreground text-sm">
                  {author}
                </div>
              )}
              {role && (
                <div className="text-xs text-muted-foreground">{role}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
