/*
'use client';

import { useEffect } from "react";

export default function DisableInspect() {
  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    const disableShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("keydown", disableShortcuts);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", disableShortcuts);
    };
  }, []);

  return null; 
}
*/