export type ArticleStatus = "draft" | "published";

export interface ArticleSavePayload {
  title: string;
  sub_title?: string;
  body: string;
  tags: string[];
  language_code: string;
  status: ArticleStatus;
  base_lang_code?: string | null;
  series?: string | null;
  /** Optional link to a project this article is written about. */
  project_id?: number | null;
}

interface BuildSaveRequestOptions {
  articleId: string | null;
  payload: ArticleSavePayload;
}

export function buildArticleSaveRequest({
  articleId,
  payload,
}: BuildSaveRequestOptions): {
  method: "POST" | "PATCH";
  url: string;
  body: ArticleSavePayload;
} {
  if (!articleId) {
    return {
      method: "POST",
      url: "/api/articles",
      body: {
        ...payload,
        status: "draft",
      },
    };
  }

  return {
    method: "PATCH",
    url: `/api/articles/${encodeURIComponent(articleId)}`,
    body: payload,
  };
}
