interface ScreenshotProps {
  src: string;
  alt: string;
  caption?: string;
  bordered?: boolean;
  shadow?: boolean;
}

export function Screenshot({
  src,
  alt,
  caption,
  bordered = true,
  shadow = true,
}: ScreenshotProps) {
  return (
    <figure className="my-8">
      <div
        className={`
        relative rounded-xl overflow-hidden bg-muted
        ${bordered ? "border border-border" : ""}
        ${shadow ? "shadow-lg" : ""}
      `}
      >
        <img src={src} alt={alt} className="w-full h-auto" />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
