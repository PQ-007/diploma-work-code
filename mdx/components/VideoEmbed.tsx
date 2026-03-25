interface VideoEmbedProps {
  url: string;
  title?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
}

export function VideoEmbed({
  url,
  title = "Video",
  aspectRatio = "16/9",
}: VideoEmbedProps) {
  // Extract video ID and platform
  const getEmbedUrl = (url: string) => {
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be")
        ? url.split("/").pop()
        : new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = url.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return url;
  };

  const aspectRatioClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
  };

  return (
    <div className="my-8">
      <div
        className={`
        relative overflow-hidden rounded-xl border border-border shadow-lg
        ${aspectRatioClasses[aspectRatio]}
      `}
      >
        <iframe
          src={getEmbedUrl(url)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
