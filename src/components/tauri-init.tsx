"use client";

import { useEffect } from "react";

export function TauriInit() {
  useEffect(() => {
    // Disable right-click menu in Tauri
    if (typeof window !== "undefined" && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };
      
      document.addEventListener("contextmenu", handleContextMenu);
      
      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, []);

  return null;
}
