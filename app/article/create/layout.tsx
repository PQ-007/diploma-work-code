import { Suspense } from "react";
import { ArticleEditorProvider } from "./ArticleEditorContext";
import { LogoLoader } from "@/components/brand/LogoLoader";

function ArticleEditorWrapper({ children }: { children: React.ReactNode }) {
  return <ArticleEditorProvider>{children}</ArticleEditorProvider>;
}

export default function ArticleCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LogoLoader />}>
      <ArticleEditorWrapper>{children}</ArticleEditorWrapper>
    </Suspense>
  );
}
