"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: React.ReactNode }) {
  const [portalElement, setPortalElement] = useState<Element | null>(null);

  useEffect(() => {
    const element = document.getElementById("portal-root");
    setPortalElement(element);
  }, []);

  if (!portalElement) {
    return null;
  }

  return createPortal(children, portalElement);
}