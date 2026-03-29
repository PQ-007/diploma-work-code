import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartProps {
  type: "bar" | "line" | "pie" | "area";
  data: Array<Record<string, any>>;
  xKey?: string;
  yKey?: string;
  title?: string;
  description?: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
];

export function Chart({
  type,
  data,
  xKey = "name",
  yKey = "value",
  title,
  description,
  height = 300,
  colors = DEFAULT_COLORS,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: ChartProps) {
  const axisTick = {
    className: "fill-muted-foreground",
    fontSize: 12,
  };
  const axisLine = { stroke: "hsl(var(--border))" };
  const gridStroke = "hsl(var(--border) / 0.6)";
  const tooltipStyle = {
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "14px",
    color: "hsl(var(--foreground))",
  };
  const legendStyle = {
    color: "hsl(var(--muted-foreground))",
    fontSize: "12px",
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            )}
            <XAxis
              dataKey={xKey}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              tickMargin={8}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
            )}
            {showLegend && <Legend wrapperStyle={legendStyle} />}
            <Bar dataKey={yKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case "line":
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            )}
            <XAxis
              dataKey={xKey}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              tickMargin={8}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
            )}
            {showLegend && <Legend wrapperStyle={legendStyle} />}
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: colors[0],
                strokeWidth: 2,
                fill: "hsl(var(--background))",
              }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            )}
            <XAxis
              dataKey={xKey}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              tickMargin={8}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
            )}
            {showLegend && <Legend wrapperStyle={legendStyle} />}
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height / 3, 120)}
              fill={colors[0]}
              dataKey={yKey}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
            )}
            {showLegend && <Legend wrapperStyle={legendStyle} />}
          </PieChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-6 shadow-md">
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Usage examples for documentation:
/*
<Chart
  type="bar"
  data={[
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 }
  ]}
  title="Monthly Sales"
  description="Sales data for the first quarter"
/>

<Chart
  type="pie"
  data={[
    { name: 'React', value: 45 },
    { name: 'Vue', value: 30 },
    { name: 'Angular', value: 25 }
  ]}
  title="Framework Usage"
  xKey="name"
  yKey="value"
/>
*/
