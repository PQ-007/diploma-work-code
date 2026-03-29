"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  caption?: string;
  bordered?: boolean;
  shadow?: boolean;
  zoomable?: boolean;
  inline?: boolean;
}

export function Image({
  src,
  alt = "",
  caption,
  bordered = true,
  shadow = true,
  zoomable = true,
  inline = false,
  className,
  ...rest
}: ImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const imageSrc = typeof src === "string" ? src : "";
  const lightbox =
    zoomable &&
    isOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setIsOpen(false)}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setIsOpen(false)}
          aria-label="Close image preview"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <img
          src={imageSrc}
          alt={alt}
          className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>,
      document.body,
    );

  if (!imageSrc) return null;

  if (inline) {
    return (
      <>
        <span className="my-6 block">
          <button
            type="button"
            className={`w-full rounded-xl bg-muted text-left ${
              bordered ? "border border-border" : ""
            } ${shadow ? "shadow-lg" : ""} ${zoomable ? "cursor-zoom-in" : ""}`}
            onClick={() => zoomable && setIsOpen(true)}
          >
            <img
              src={imageSrc}
              alt={alt}
              className={`w-full h-auto rounded-xl ${className || ""}`}
              {...rest}
            />
          </button>
        </span>

        {lightbox}
      </>
    );
  }

  return (
    <>
      <figure className="my-8">
        <div
          className={`
            relative rounded-xl overflow-hidden bg-muted
            ${bordered ? "border border-border" : ""}
            ${shadow ? "shadow-lg" : ""}
            ${zoomable ? "cursor-zoom-in" : ""}
          `}
          onClick={() => zoomable && setIsOpen(true)}
        >
          <img
            src={imageSrc}
            alt={alt}
            className={`w-full h-auto ${className || ""}`}
            {...rest}
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-muted-foreground italic">
            {caption}
          </figcaption>
        )}
      </figure>

      {lightbox}
    </>
  );
}
