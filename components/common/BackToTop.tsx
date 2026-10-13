"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/** Content scrolls inside <main> (see AppChrome), not the window. */
function scroller(): HTMLElement | null {
  return document.querySelector("main");
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scroller();
    if (!el) return;
    const onScroll = () => setVisible(el.scrollTop > 600);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Back to top"
      onClick={() => scroller()?.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-30 hidden rounded-full shadow-md md:inline-flex"
    >
      <ArrowUp />
    </Button>
  );
}
