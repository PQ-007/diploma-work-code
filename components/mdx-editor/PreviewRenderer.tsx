"use client";

import { useEffect, useState } from "react";
import { compileMdx } from "../mdx-editor/MdxCompiler";

export function MdxPreview({ source }: { source: string }) {
  const [Content, setContent] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const mod = await compileMdx(source);
        setContent(() => mod.default);
      } catch (e) {
        setContent(() => () => (
          <pre className="text-red-500">
            {String(e)}
          </pre>
        ));
      }
    };

    run();
  }, [source]);

  if (!Content) return null;
  return <Content />;
}
