import { MDXRemote } from "next-mdx-remote/rsc";
import CodeWindow from "@/components/CodeWindow";

const components = {
  code: ({ children, className }: any) => {
    const language = className?.replace("language-", "") || "text";
    return (
      <CodeWindow
        code={String(children).trim()}
        language={language}
      />
    );
  },
};

export default function MDXRenderer({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />;
}
