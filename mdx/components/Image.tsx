import Image from "next/image";

export function RImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { alt = "", src, width, height, ...rest } = props;

  if (!src || typeof src !== "string") {
    return (
      <img
        alt={alt}
        src=""
        {...rest}
        className="rounded-lg border border-border/50 shadow-md my-8 w-full object-cover"
      />
    );
  }

  const resolvedWidth = width || 800;
  const resolvedHeight = height || 600;

  return (
    <Image
      alt={alt}
      src={src}
      width={
        typeof resolvedWidth === "number"
          ? resolvedWidth
          : Number(resolvedWidth)
      }
      height={
        typeof resolvedHeight === "number"
          ? resolvedHeight
          : Number(resolvedHeight)
      }
      className="rounded-lg border border-border/50 shadow-md my-8 w-full object-cover"
    />
  );
}