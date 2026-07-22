import { useEffect, useState } from "react";

function isTextEditingControl(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  return element.matches("input, textarea, select, [contenteditable='true']");
}

export function useMobileKeyboardState(): boolean {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let baselineHeight = Math.max(window.innerHeight, viewport.height);
    let frame = 0;

    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const editing = isTextEditingControl(document.activeElement);
        if (!editing) baselineHeight = Math.max(baselineHeight, window.innerHeight, viewport.height);
        const reducedBy = baselineHeight - viewport.height;
        setKeyboardOpen(editing && reducedBy > Math.max(140, baselineHeight * 0.2));
      });
    };

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("focusin", update);
    window.addEventListener("focusout", update);
    window.addEventListener("orientationchange", update);
    update();

    return () => {
      window.cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return keyboardOpen;
}

