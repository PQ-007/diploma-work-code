import React from "react";

export function Pre({
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre className="overflow-x-auto" {...props}>
      {children}
    </pre>
  );
}
