"use client";

import { useTranslation } from "react-i18next";
import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExternalLink, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import type { ProjectFile } from "@/app/project/types";

interface ProjectAttachmentsSectionProps {
  nonImageFiles: ProjectFile[];
  editSlug: string | null;
  fileName: string;
  setFileName: Dispatch<SetStateAction<string>>;
  fileType: string;
  setFileType: Dispatch<SetStateAction<string>>;
  fileUrl: string;
  setFileUrl: Dispatch<SetStateAction<string>>;
  uploadingAttach: boolean;
  savingFile: boolean;
  fileAttachInputRef: RefObject<HTMLInputElement | null>;
  handleAttachUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleAddFile: () => void;
  handleDeleteFile: (id: number) => void;
}

export function ProjectAttachmentsSection({
  nonImageFiles,
  editSlug,
  fileName,
  setFileName,
  fileType,
  setFileType,
  fileUrl,
  setFileUrl,
  uploadingAttach,
  savingFile,
  fileAttachInputRef,
  handleAttachUpload,
  handleAddFile,
  handleDeleteFile,
}: ProjectAttachmentsSectionProps) {
  const { t } = useTranslation();
  const f = (k: string) => t(`project.form.${k}`);
  return (
    <Card className="gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold">{f("attachments")}</h3>
      </div>

      {nonImageFiles.length > 0 && (
        <div className="space-y-2 mb-4">
          {nonImageFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-md border border-border p-3"
            >
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 min-w-0 flex-1 text-sm hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{file.file_name}</span>
              </a>
              {file.file_size && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {(file.file_size / 1024).toFixed(0)} KB
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={() => handleDeleteFile(file.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {editSlug ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            {f("addFile")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder={f("fileName")}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              
            />
            <Input
              placeholder={f("fileType")}
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              
            />
          </div>
          <Input
            placeholder={f("fileUrl")}
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              {uploadingAttach ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              {uploadingAttach ? "Uploading…" : "Upload Image"}
              <input
                ref={fileAttachInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAttachUpload}
                disabled={uploadingAttach}
              />
            </label>
            <Button
              variant="secondary"
              onClick={handleAddFile}
              disabled={savingFile || uploadingAttach}
            >
              {savingFile ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              {savingFile ? "Adding…" : "Add File"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {f("saveFirstFiles")}
        </p>
      )}
    </Card>
  );
}
