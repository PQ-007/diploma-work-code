import { useState } from "react";

interface CreateArticlePayload {
  title: string;
  sub_title?: string;
  body: string;
  tags: string[];
  language_code: string;
  status: "draft" | "published";
}

interface ArticleOperationsState {
  articleId: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  justSaved: boolean;
  error: string | null;
}

export function useArticleOperations() {
  const [state, setState] = useState<ArticleOperationsState>({
    articleId: null,
    isSaving: false,
    isPublishing: false,
    justSaved: false,
    error: null,
  });

  const saveAsDraft = async (
    payload: Omit<CreateArticlePayload, "status">,
  ): Promise<string | null> => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          status: "draft",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      const data = (await response.json()) as { article_id: string };
      setState((prev) => ({
        ...prev,
        articleId: data.article_id,
        isSaving: false,
        justSaved: true,
      }));

      // Clear saved feedback after 2 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, justSaved: false }));
      }, 2000);

      return data.article_id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save";
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: errorMsg,
      }));
      console.error("Error saving article", err);
      return null;
    }
  };

  const publish = async (): Promise<boolean> => {
    if (!state.articleId) {
      setState((prev) => ({
        ...prev,
        error: "No article ID available",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isPublishing: true, error: null }));

    try {
      const response = await fetch(`/api/articles/${state.articleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      setState((prev) => ({
        ...prev,
        isPublishing: false,
      }));

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to publish";
      setState((prev) => ({
        ...prev,
        isPublishing: false,
        error: errorMsg,
      }));
      console.error("Error publishing article", err);
      return false;
    }
  };

  const createAndPublish = async (
    payload: Omit<CreateArticlePayload, "status">,
  ): Promise<string | null> => {
    const articleId = await saveAsDraft(payload);
    if (!articleId) return null;

    // Update state so publish() has the article ID
    setState((prev) => ({ ...prev, articleId }));

    const success = await publish();
    return success ? articleId : null;
  };

  return {
    state,
    saveAsDraft,
    publish,
    createAndPublish,
  };
}
