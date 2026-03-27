import { CheckCircle, Circle, Clock } from 'lucide-react';
import { getIcon, type IconName } from "./iconMap";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  description?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  striped?: boolean;
  steps?: Array<{
    label: string;
    value: number;
    icon?: IconName | string;
  }>;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  description,
  showPercentage = true,
  showValue = false,
  size = 'md',
  variant = 'default',
  animated = false,
  striped = false,
  steps,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    sm: {
      height: 'h-1.5',
      text: 'text-xs',
      padding: 'py-1',
    },
    md: {
      height: 'h-2.5',
      text: 'text-sm',
      padding: 'py-2',
    },
    lg: {
      height: 'h-4',
      text: 'text-base',
      padding: 'py-3',
    },
  };

  const variantStyles = {
    default: 'bg-primary',
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  // Step-based progress bar
  if (steps && steps.length > 0) {
    return (
      <div className="my-6">
        {(label || description) && (
          <div className="mb-4">
            {label && (
              <div className="flex items-center justify-between">
                <h4 className={`font-medium text-foreground ${currentSize.text}`}>
                  {label}
                </h4>
                {showPercentage && (
                  <span className={`text-muted-foreground ${currentSize.text}`}>
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {steps.map((step, index) => {
            const stepPercentage = Math.min(Math.max((step.value / max) * 100, 0), 100);
            const isCompleted = step.value >= max;
            const isActive = step.value > 0 && step.value < max;
            const Icon = step.icon ? getIcon(step.icon) : null;

            return (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : isActive ? (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  ) : Icon ? (
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${currentSize.text} ${
                      isCompleted ? 'text-green-600 dark:text-green-400' :
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                    <span className={`text-xs text-muted-foreground`}>
                      {step.value}/{max}
                    </span>
                  </div>

                  <div className={`w-full bg-muted rounded-full overflow-hidden ${currentSize.height}`}>
                    <div
                      className={`${currentSize.height} rounded-full transition-all duration-500 ease-out ${
                        isCompleted ? 'bg-green-500' :
                        isActive ? currentVariant : 'bg-muted-foreground/30'
                      } ${animated ? 'animate-pulse' : ''} ${
                        striped && isActive ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer' : ''
                      }`}
                      style={{ width: `${stepPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard progress bar
  return (
    <div className="my-6">
      {(label || description || showPercentage || showValue) && (
        <div className={`flex items-center justify-between mb-2 ${currentSize.padding}`}>
          <div>
            {label && (
              <h4 className={`font-medium text-foreground ${currentSize.text}`}>
                {label}
              </h4>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showValue && (
              <span className={`text-muted-foreground ${currentSize.text}`}>
                {value}/{max}
              </span>
            )}
            {showPercentage && (
              <span className={`font-medium text-foreground ${currentSize.text}`}>
                {percentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`w-full bg-muted rounded-full overflow-hidden ${currentSize.height}`}>
        <div
          className={`${currentSize.height} rounded-full transition-all duration-500 ease-out ${currentVariant} ${
            animated ? 'animate-pulse' : ''
          } ${
            striped ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Multi-progress component for showing multiple progress bars
interface MultiProgressProps {
  items: Array<{
    label: string;
    value: number;
    max?: number;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  }>;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentages?: boolean;
}

export function MultiProgress({
  items,
  title,
  description,
  size = 'md',
  showPercentages = true,
}: MultiProgressProps) {
  return (
    <div className="my-6 rounded-xl border border-border bg-card p-6 shadow-md">
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <ProgressBar
            key={index}
            value={item.value}
            max={item.max || 100}
            label={item.label}
            size={size}
            variant={item.variant}
            showPercentage={showPercentages}
          />
        ))}
      </div>
    </div>
  );
}

// Usage examples:
/*
<ProgressBar
  value={65}
  label="Project Completion"
  description="Overall project progress"
  variant="primary"
  size="md"
  animated={true}
/>

<ProgressBar
  value={3}
  max={5}
  steps={[
    { label: 'Planning', value: 5, icon: 'FileText' },
    { label: 'Development', value: 4, icon: 'Code' },
    { label: 'Testing', value: 2, icon: 'TestTube' },
    { label: 'Deployment', value: 0, icon: 'Upload' },
    { label: 'Monitoring', value: 0, icon: 'Activity' }
  ]}
  label="Development Pipeline"
  description="Current status of the development process"
/>

<MultiProgress
  title="Team Performance"
  description="Individual team member progress on current sprint"
  items={[
    { label: 'Alice Johnson', value: 85, variant: 'success' },
    { label: 'Bob Smith', value: 72, variant: 'primary' },
    { label: 'Carol Davis', value: 45, variant: 'warning' },
    { label: 'David Wilson', value: 92, variant: 'success' }
  ]}
/>
*/