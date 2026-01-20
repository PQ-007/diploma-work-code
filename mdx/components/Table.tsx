export function Table({
  data,
  children,
}: {
  data?: { headers: string[]; rows: (string | number)[][] };
  children?: React.ReactNode;
}) {
  // If structured data is provided (from custom component usage)
  if (data && Array.isArray(data.headers) && Array.isArray(data.rows)) {
    const headers = data.headers.map((header, index) => (
      <th
        key={index}
        className="px-4 py-3 text-left text-sm font-semibold text-foreground bg-muted/50 border-b-2 border-border"
      >
        {header}
      </th>
    ));

    const rows = data.rows.map((row, index) => (
      <tr
        key={index}
        className="border-t border-border/50 hover:bg-muted/30 transition-colors"
      >
        {row.map((cell, cellIndex) => (
          <td key={cellIndex} className="px-4 py-3 text-sm text-foreground">
            {cell}
          </td>
        ))}
      </tr>
    ));

    return (
      <div className="my-8 overflow-x-auto rounded-lg border border-border shadow-sm">
        <table className="w-full min-w-full divide-y divide-border/50">
          <thead>
            <tr>{headers}</tr>
          </thead>
          <tbody className="divide-y divide-border/30 bg-card">{rows}</tbody>
        </table>
      </div>
    );
  }

  // Fallback for markdown tables using native markup
  return (
    <div className="my-8 overflow-x-auto rounded-lg border border-border shadow-sm">
      <table className="w-full min-w-full divide-y divide-border/50 prose-table:my-0 prose-th:px-4 prose-td:px-4 prose-th:py-3 prose-td:py-3">
        {children}
      </table>
    </div>
  );
}