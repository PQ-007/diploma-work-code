import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getIcon, type IconName } from "./iconMap";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: IconName | string;
  suffix?: string;
  prefix?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  description?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  suffix = '',
  prefix = '',
  variant = 'default',
  size = 'md',
  showTrend = true,
  description,
}: MetricCardProps) {
  const Icon = icon ? getIcon(icon) : null;

  const getTrendIcon = () => {
    if (!change || !showTrend) return null;
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!change) return 'text-muted-foreground';
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const variantStyles = {
    default: {
      bg: 'bg-card',
      border: 'border-border',
      iconBg: 'bg-muted',
      iconColor: 'text-foreground',
    },
    primary: {
      bg: 'bg-primary/5',
      border: 'border-primary/20',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    success: {
      bg: 'bg-green-500/5',
      border: 'border-green-500/20',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    warning: {
      bg: 'bg-yellow-500/5',
      border: 'border-yellow-500/20',
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    danger: {
      bg: 'bg-red-500/5',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const sizeStyles = {
    sm: {
      container: 'p-4',
      title: 'text-xs',
      value: 'text-lg',
      icon: 'w-4 h-4',
      iconContainer: 'p-1.5',
    },
    md: {
      container: 'p-6',
      title: 'text-sm',
      value: 'text-2xl',
      icon: 'w-5 h-5',
      iconContainer: 'p-2',
    },
    lg: {
      container: 'p-8',
      title: 'text-base',
      value: 'text-3xl',
      icon: 'w-6 h-6',
      iconContainer: 'p-3',
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  // Format large numbers
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  return (
    <div className={`
      my-4 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
      ${currentVariant.bg} ${currentVariant.border} ${currentSize.container}
    `}>
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className={`font-medium text-muted-foreground ${currentSize.title}`}>
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 opacity-80">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`
            rounded-lg flex-shrink-0
            ${currentVariant.iconBg} ${currentSize.iconContainer}
          `}>
            <Icon className={`${currentSize.icon} ${currentVariant.iconColor}`} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-2">
        {prefix && (
          <span className={`text-muted-foreground ${currentSize.title}`}>
            {prefix}
          </span>
        )}
        <p className={`font-bold text-foreground ${currentSize.value}`}>
          {formatValue(value)}
        </p>
        {suffix && (
          <span className={`text-muted-foreground ${currentSize.title}`}>
            {suffix}
          </span>
        )}
      </div>

      {/* Trend indicator */}
      {(change !== undefined || changeLabel) && (
        <div className="flex items-center gap-2">
          {change !== undefined && showTrend && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-xs font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
          {changeLabel && (
            <span className="text-xs text-muted-foreground">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Metric Grid component for displaying multiple metrics
interface MetricGridProps {
  metrics: Array<Omit<MetricCardProps, 'size'> & { id: string }>;
  columns?: number;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  description?: string;
}

export function MetricGrid({
  metrics,
  columns = 2,
  size = 'md',
  title,
  description,
}: MetricGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className="my-6">
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

      <div className={`grid gap-4 ${gridCols[Math.min(columns, 4) as keyof typeof gridCols]}`}>
        {metrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} size={size} />
        ))}
      </div>
    </div>
  );
}

// Usage examples:
/*
<MetricCard
  title="Total Users"
  value={15420}
  change={12.5}
  changeLabel="vs last month"
  icon="Users"
  variant="primary"
  description="Active registered users"
/>

<MetricCard
  title="Revenue"
  value={54280}
  prefix="$"
  change={-2.4}
  changeLabel="vs last month"
  icon="DollarSign"
  variant="success"
  size="lg"
/>

<MetricGrid
  title="Key Performance Indicators"
  description="Overview of important business metrics"
  columns={3}
  metrics={[
    {
      id: 'users',
      title: 'Active Users',
      value: 2340,
      change: 15.2,
      icon: 'Users',
      variant: 'primary'
    },
    {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: 45600,
      prefix: '$',
      change: 8.7,
      icon: 'DollarSign',
      variant: 'success'
    },
    {
      id: 'conversion',
      title: 'Conversion Rate',
      value: '3.24',
      suffix: '%',
      change: -1.2,
      icon: 'Target',
      variant: 'warning'
    }
  ]}
/>
*/