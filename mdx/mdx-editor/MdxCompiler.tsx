import { compile } from "@mdx-js/mdx";
import * as runtime from "react/jsx-dev-runtime";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import rehypeHighlight from "rehype-highlight";

export async function compileMdx(source: string) {
  const compiled = await compile(source, {
    outputFormat: "function-body",
    development: true,
    remarkPlugins: [remarkGfm, remarkDirective],
    rehypePlugins: [rehypeHighlight],
  });

  const fn = new Function(String(compiled));
  return fn(runtime);
}
