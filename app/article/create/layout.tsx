import { Suspense } from "react";
import { ArticleEditorProvider } from "./ArticleEditorContext";

function ArticleEditorWrapper({ children }: { children: React.ReactNode }) {
  return <ArticleEditorProvider>{children}</ArticleEditorProvider>;
}

export default function ArticleCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArticleEditorWrapper>{children}</ArticleEditorWrapper>
    </Suspense>
  );
}
