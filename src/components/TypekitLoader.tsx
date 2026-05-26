"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Typekit?: {
      load: (config: {
        async?: boolean;
        scriptTimeout?: number;
        active?: () => void;
        inactive?: () => void;
      }) => void;
    };
    __typekitStatus?: string;
  }
}

const TYPEKIT_SRC = "https://use.typekit.net/fok1xnt.js";

function setTypekitStatus(status: string) {
  window.__typekitStatus = status;
  try {
    window.localStorage.setItem("typekit-status", status);
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

function loadTypekit() {
  if (!window.Typekit) {
    setTypekitStatus("load-error");
    return;
  }

  setTypekitStatus("loading");
  window.Typekit.load({
    async: true,
    scriptTimeout: 8000,
    active: () => setTypekitStatus("active"),
    inactive: () => setTypekitStatus("inactive"),
  });
}

export default function TypekitLoader() {
  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TYPEKIT_SRC}"]`
    );

    if (window.Typekit) {
      loadTypekit();
      return;
    }

    setTypekitStatus("script-loading");

    const script = existingScript ?? document.createElement("script");
    script.src = TYPEKIT_SRC;
    script.async = true;
    script.onload = loadTypekit;
    script.onerror = () => setTypekitStatus("script-error");

    if (!existingScript) {
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
