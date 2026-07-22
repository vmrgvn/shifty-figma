import { useEffect, useMemo, useState } from "react";
import type { DesktopNavigationPreference } from "../../../data/repositories/localAppRepository";

export type DesktopNavigationPresentation = "dock" | "compact" | "preview" | "pinned";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useDesktopNavigationMode(preference: DesktopNavigationPreference, pathname: string) {
  const desktopRailAllowed = useMediaQuery("(min-width: 1024px)");
  const pinnedLayoutAllowed = useMediaQuery("(min-width: 1200px)");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => setPreviewOpen(false), [pathname]);
  useEffect(() => {
    if (!desktopRailAllowed) setPreviewOpen(false);
  }, [desktopRailAllowed]);

  const presentation = useMemo<DesktopNavigationPresentation>(() => {
    if (!desktopRailAllowed) return "dock";
    if (preference === "pinned" && pinnedLayoutAllowed) return "pinned";
    return previewOpen ? "preview" : "compact";
  }, [desktopRailAllowed, pinnedLayoutAllowed, preference, previewOpen]);

  return {
    presentation,
    pinnedLayoutAllowed,
    previewOpen,
    closePreview: () => setPreviewOpen(false),
    togglePreview: () => setPreviewOpen(value => !value),
  };
}
