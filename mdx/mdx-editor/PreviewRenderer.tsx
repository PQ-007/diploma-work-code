"use client";

import { useEffect, useState } from "react";
import { compileMdx } from "./MdxCompiler";
import { components } from "@/mdx/mdx-components";
export function MdxPreview({ source }: { source: string }) {
  const [Content, setContent] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const mod = await compileMdx(source);
        setContent(() => mod.default);
      } catch (e) {
        setContent(() => () => {String(e)});
      }
    };

    run();
  }, [source]);

  if (!Content) return null;
  return <Content components={components} />;
}
