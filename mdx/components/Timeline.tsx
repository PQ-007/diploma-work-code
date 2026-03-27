import { Circle } from "lucide-react";

interface TimelineItem {
  date: string;
  title: string;
  description: React.ReactNode;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="my-8 relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-8">
        {items.map((item, index) => (
          <div key={index} className="relative flex gap-6 group">
            {/* Timeline dot */}
            <div className="flex-shrink-0 relative z-10">
              <div
                className="w-8 h-8 rounded-full bg-primary border-4 border-background
                           flex items-center justify-center
                           group-hover:scale-125 group-hover:shadow-lg
                           transition-all duration-300"
              >
                <Circle className="w-3 h-3 text-primary-foreground fill-current" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="text-sm font-medium text-primary mb-1">
                {item.date}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
