"use client";

import { useEffect, useState } from "react";

export function useMarkdownColorMode(): "light" | "dark" {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const updateColorMode = () => {
      setColorMode(root.classList.contains("dark") ? "dark" : "light");
    };

    updateColorMode();
    const observer = new MutationObserver(updateColorMode);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return colorMode;
}
