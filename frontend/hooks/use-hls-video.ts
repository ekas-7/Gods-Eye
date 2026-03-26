"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

export function useHlsVideo(src: string) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ autoStartLoad: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      video.play().catch(() => {});

      return () => {
        hls.destroy();
      };
    }
  }, [src]);

  return ref;
}
