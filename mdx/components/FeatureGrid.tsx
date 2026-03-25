import { type LucideIcon } from "lucide-react";
import { getIcon, type IconName } from "./iconMap";

interface Feature {
  icon: LucideIcon | IconName | string;
  title: string;
  description: string;
}

export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="my-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const Icon = getIcon(feature.icon);

        return (
          <div
            key={index}
            className="group relative rounded-xl border border-border bg-card p-6
                       hover:border-primary/50 hover:shadow-lg
                       transition-all duration-300 hover:-translate-y-1"
          >
            {/* Icon */}
            {Icon && (
              <div
                className="mb-4 inline-flex p-3 rounded-lg bg-primary/10
                           group-hover:bg-primary/20 transition-colors"
              >
                <Icon className="w-6 h-6 text-primary" />
              </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>

            {/* Hover effect border */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                         transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, transparent 100%)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
