import { Check, X } from "lucide-react";

interface ComparisonColumn {
  name: string;
  highlight?: boolean;
}

interface ComparisonRow {
  feature: string;
  values: (boolean | string)[];
}

export function ComparisonTable({
  columns,
  rows,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
}) {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-border shadow-lg">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Feature
            </th>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`
                  px-6 py-4 text-center text-sm font-semibold
                  ${
                    col.highlight
                      ? "bg-primary/10 text-primary border-x-2 border-primary/30"
                      : "text-foreground"
                  }
                `}
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border/50 hover:bg-muted/20 transition-colors"
            >
              <td className="px-6 py-4 text-sm font-medium text-foreground">
                {row.feature}
              </td>
              {row.values.map((value, colIndex) => (
                <td
                  key={colIndex}
                  className={`
                    px-6 py-4 text-center
                    ${
                      columns[colIndex].highlight
                        ? "bg-primary/5 border-x-2 border-primary/20"
                        : ""
                    }
                  `}
                >
                  {typeof value === "boolean" ? (
                    value ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {value}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
