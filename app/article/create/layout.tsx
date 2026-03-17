import { ArticleEditorProvider } from "./ArticleEditorContext";

export default function ArticleCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ArticleEditorProvider>{children}</ArticleEditorProvider>;
}
