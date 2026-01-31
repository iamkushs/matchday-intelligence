"use client";

import { useEffect, useRef } from "react";

type NotStartedAnimationProps = {
  className?: string;
};

export function NotStartedAnimation({ className }: NotStartedAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animation:
      | { destroy?: () => void; setSpeed?: (speed: number) => void }
      | null = null;
    let isMounted = true;

    async function loadAnimation() {
      const lottie = await import("lottie-web");
      if (!isMounted || !containerRef.current) {
        return;
      }
      animation = lottie.default.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/Assets/animations/12345.json"
      });
      animation.setSpeed?.(0.5);
    }

    loadAnimation();

    return () => {
      isMounted = false;
      if (animation?.destroy) {
        animation.destroy();
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
