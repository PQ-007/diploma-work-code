export function Table({
  data,
}: {
  data: { headers: string[]; rows: (string | number)[][] };
}) {
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