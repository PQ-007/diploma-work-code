"use client";

import type {
  ChangeEvent,
  Dispatch,
  RefObject,
  SetStateAction,
} from "react";
import { ImagePlus, Loader2, Play, Plus, X } from "lucide-react";
import type { PendingImage } from "../useProjectForm";

interface GalleryStripItem {
  url: string;
  id: string;
  fileId: number | null;
  isPending: boolean;
}

interface ProjectMediaSectionProps {
  title: string;
  selectedMediaId: string;
  setSelectedMediaId: Dispatch<SetStateAction<string>>;
  activeGalleryUrl: string | null;
  thumbnailUrl: string;
  setThumbnailUrl: Dispatch<SetStateAction<string>>;
  youTubeId: string | null;
  uploadingThumbnail: boolean;
  uploadingGallery: boolean;
  thumbnailInputRef: RefObject<HTMLInputElement | null>;
  galleryInputRef: RefObject<HTMLInputElement | null>;
  pendingImages: PendingImage[];
  setPendingImages: Dispatch<SetStateAction<PendingImage[]>>;
  galleryStripItems: GalleryStripItem[];
  editSlug: string | null;
  handleThumbnailUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleGalleryUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleDeleteFile: (id: number) => Promise<void>;
}

export function ProjectMediaSection({
  title,
  selectedMediaId,
  setSelectedMediaId,
  activeGalleryUrl,
  thumbnailUrl,
  setThumbnailUrl,
  youTubeId,
  uploadingThumbnail,
  uploadingGallery,
  thumbnailInputRef,
  galleryInputRef,
  pendingImages,
  setPendingImages,
  galleryStripItems,
  editSlug,
  handleThumbnailUpload,
  handleGalleryUpload,
  handleDeleteFile,
}: ProjectMediaSectionProps) {
  return (
    <div className="space-y-2">
      {/* Main viewer */}
      <div
        className={`relative w-full aspect-[16/9] rounded-md overflow-hidden border border-border bg-muted/30 shadow-[0_22px_40px_rgba(0,0,0,0.2)] ${selectedMediaId === "thumbnail" || !activeGalleryUrl ? "group cursor-pointer" : ""}`}
        onClick={() => {
          if (
            selectedMediaId === "thumbnail" ||
            (!activeGalleryUrl && selectedMediaId !== "youtube")
          ) {
            thumbnailInputRef.current?.click();
          }
        }}
      >
        {uploadingThumbnail ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : selectedMediaId === "youtube" && youTubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1`}
            title="Project preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : activeGalleryUrl ? (
          <img
            src={activeGalleryUrl}
            alt="gallery"
            className="w-full h-full object-cover"
          />
        ) : thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={title || "thumbnail"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors flex flex-col items-center justify-center gap-2">
              <ImagePlus className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                Change Thumbnail
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
            <ImagePlus className="h-10 w-10" />
            <span className="text-sm font-medium">Upload Thumbnail</span>
            <span className="text-xs opacity-60">Recommended 16:9</span>
          </div>
        )}
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleThumbnailUpload}
          disabled={uploadingThumbnail}
        />
      </div>

      {/* Horizontal strip */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scroll-smooth"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {/* YouTube thumbnail card */}
        {youTubeId && (
          <button
            type="button"
            onClick={() => setSelectedMediaId("youtube")}
            style={{ scrollSnapAlign: "start" }}
            className={`relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all ${selectedMediaId === "youtube" ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]" : "border-border/60 hover:border-border"}`}
          >
            <img
              src={`https://img.youtube.com/vi/${youTubeId}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-black/70 flex items-center justify-center">
                <Play className="h-4 w-4 text-white fill-white ml-0.5" />
              </div>
            </div>
          </button>
        )}

        {/* Thumbnail card */}
        {thumbnailUrl && (
          <button
            type="button"
            onClick={() => setSelectedMediaId("thumbnail")}
            style={{ scrollSnapAlign: "start" }}
            className={`relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all ${selectedMediaId === "thumbnail" ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]" : "border-border/60 hover:border-border"}`}
          >
            <img
              src={thumbnailUrl}
              alt="Thumbnail"
              className="w-full h-full object-cover"
            />
          </button>
        )}

        {/* Gallery image cards */}
        {galleryStripItems.map(({ url, id, fileId, isPending }) => (
          <div
            key={id}
            style={{ scrollSnapAlign: "start" }}
            className={`group/gal relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${selectedMediaId === id ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]" : "border-border/60 hover:border-border"}`}
            onClick={() => setSelectedMediaId(id)}
          >
            <img src={url} alt="gallery" className="w-full h-full object-cover" />
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (selectedMediaId === id) setSelectedMediaId("thumbnail");
                if (fileId) {
                  await handleDeleteFile(fileId);
                } else {
                  setPendingImages((p) => p.filter((x) => x.url !== url));
                }
              }}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover/gal:opacity-100 transition-opacity hover:bg-destructive"
            >
              <X className="h-3 w-3 text-white" />
            </button>
            {isPending && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white/80 text-center py-0.5">
                unsaved
              </div>
            )}
          </div>
        ))}

        {/* Add photo slot */}
        <label
          style={{ scrollSnapAlign: "start" }}
          className="flex-shrink-0 w-32 aspect-video rounded-sm border-2 border-dashed border-border/60 hover:border-primary/50 flex flex-col items-center justify-center gap-1 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
        >
          {uploadingGallery ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="text-[10px] font-medium">Add Photo</span>
            </>
          )}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryUpload}
            disabled={uploadingGallery}
          />
        </label>
      </div>

      {/* Hint row */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
        {thumbnailUrl ? (
          <button
            onClick={() => {
              setThumbnailUrl("");
              if (selectedMediaId === "thumbnail") setSelectedMediaId("youtube");
            }}
            className="hover:text-destructive transition-colors"
          >
            Remove thumbnail
          </button>
        ) : (
          <span />
        )}
        {pendingImages.length > 0 && !editSlug && (
          <span className="text-amber-500/70">
            {pendingImages.length} photo
            {pendingImages.length > 1 ? "s" : ""} pending save
          </span>
        )}
      </div>
    </div>
  );
}
