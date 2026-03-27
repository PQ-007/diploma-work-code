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
        className="px-3 sm:px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-foreground bg-muted/60 border-b border-border/70 whitespace-normal break-words"
      >
        {header}
      </th>
    ));

    const rows = data.rows.map((row, index) => (
      <tr
        key={index}
        className="border-t border-border/60 odd:bg-muted/20 even:bg-card hover:bg-muted/30 transition-colors"
      >
        {row.map((cell, cellIndex) => (
          <td
            key={cellIndex}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-foreground align-top whitespace-normal break-words leading-snug"
          >
            {cell}
          </td>
        ))}
      </tr>
    ));

    return (
      <div className="my-8 overflow-x-auto rounded-lg border border-border/60 shadow-sm">
        <table className="w-full table-auto border-collapse text-xs sm:text-sm text-foreground min-w-0">
          <thead className="bg-muted/50 text-foreground">
            <tr className="align-middle">{headers}</tr>
          </thead>
          <tbody className="bg-card">{rows}</tbody>
        </table>
      </div>
    );
  }

  // Fallback for markdown tables using native markup
  return (
    <div className="my-8 overflow-x-auto rounded-lg border border-border/60 shadow-sm">
      <table className="w-full table-auto border-collapse text-xs sm:text-sm text-foreground min-w-0">
        {children}
      </table>
    </div>
  );
}
