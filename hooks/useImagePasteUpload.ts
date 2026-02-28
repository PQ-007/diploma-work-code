import { useCallback, useState } from "react";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";

type UseImagePasteUploadOptions = {
  value: string;
  onChange: (next: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  insertAtCursor?: (markdown: string) => void;
  maxSizeMB?: number;
};

type UseImagePasteUploadReturn = {
  onPaste: (e: React.ClipboardEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  uploading: boolean;
  error?: string;
};

const IMAGE_MIME_PREFIX = "image/";
const DEFAULT_MAX_SIZE_MB = 10;

const toOptimizedUrl = (secureUrl: string, publicId: string | undefined) => {
  if (!publicId) return secureUrl;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return secureUrl;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1200/${publicId}`;
};

export function useImagePasteUpload(
  options: UseImagePasteUploadOptions,
): UseImagePasteUploadReturn {
  const {
    value,
    onChange,
    textareaRef,
    insertAtCursor,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
  } = options;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const insertMarkdown = useCallback(
    (markdown: string) => {
      setError(undefined);

      if (insertAtCursor) {
        insertAtCursor(markdown);
        return;
      }

      const el = textareaRef?.current;
      if (el) {
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const next = value.slice(0, start) + markdown + value.slice(end);
        onChange(next);

        const cursor = start + markdown.length;
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(cursor, cursor);
        });
        return;
      }

      const prefix = value.endsWith("\n") || value.length === 0 ? "" : "\n";
      onChange(`${value}${prefix}${markdown}`);
    },
    [insertAtCursor, onChange, textareaRef, value],
  );

  const pickImageFile = (
    items: DataTransferItemList | FileList | null | undefined,
  ) => {
    if (!items) return undefined;
    for (let i = 0; i < items.length; i += 1) {
      const candidate = (items as DataTransferItemList)[i];
      const file = "kind" in candidate ? candidate.getAsFile?.() : candidate;
      if (file && file.type.startsWith(IMAGE_MIME_PREFIX)) {
        return file;
      }
    }
    return undefined;
  };

  const uploadAndInsert = useCallback(
    async (file: File) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File too large. Max ${maxSizeMB}MB.`);
        return;
      }

      setUploading(true);
      try {
        const { secureUrl, publicId } = await uploadImageToCloudinary(file);
        const url = toOptimizedUrl(secureUrl, publicId);
        insertMarkdown(`![](${url})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setError(message);
      } finally {
        setUploading(false);
      }
    },
    [insertMarkdown, maxSizeMB],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLElement>) => {
      if (uploading) return;
      const file = pickImageFile(e.clipboardData?.items);
      if (!file) return;
      e.preventDefault();
      void uploadAndInsert(file);
    },
    [uploadAndInsert, uploading],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (uploading) return;
      const file = pickImageFile(e.dataTransfer?.files);
      if (!file) return;
      void uploadAndInsert(file);
    },
    [uploadAndInsert, uploading],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  return { onPaste, onDrop, onDragOver, uploading, error };
}

export const imagePasteUploadManualTestChecklist = [
  "Paste an image (<10MB) from clipboard and see markdown inserted at cursor",
  "Drop an image file (<10MB) onto editor and see markdown inserted",
  "Try pasting non-image: event should fall through without upload",
  "Try a >10MB image: should show size error and skip upload",
  "Simulate Cloudinary failure (bad preset): should show error and stop uploading",
];

// For contenteditable editors, pass an insertAtCursor implementation that
// computes offsets from the current Selection/Range, then call onChange with
// the updated markdown string.
