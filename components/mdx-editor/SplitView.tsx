"use client";

import { useState } from "react";
import { MdxEditor } from "./MonacoEditor";
import { MdxPreview } from "./PreviewRenderer";

const initial = `# Hello

\`\`\`ts
console.log("MDX works")
\`\`\`

:::info
Admonition works
:::
`;

export default function EditorPage() {
  const [mdx, setMdx] = useState(initial);

  return (
    <div className="grid grid-cols-2 h-screen">
      <div className="border-r">
        <MdxEditor value={mdx} onChange={setMdx} />
      </div>
      <div className="p-8 overflow-y-auto prose max-w-none">
        <MdxPreview source={mdx} />
      </div>
    </div>
  );
}
