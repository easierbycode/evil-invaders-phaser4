type LegacyFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullScreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type LegacyFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

let viewportFallbackInitialized = false;

function isIOSWebKit() {
  const userAgent = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function applyViewportFillFallback() {
  const root = document.documentElement;
  const body = document.body;
  const gameRoot = document.getElementById("game") as HTMLElement | null;

  const applySize = () => {
    const viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);
    root.style.setProperty("--app-vh", `${viewportHeight}px`);
    body.style.height = "var(--app-vh)";
    body.style.minHeight = "var(--app-vh)";
    if (gameRoot) {
      gameRoot.style.width = "100vw";
      gameRoot.style.height = "var(--app-vh)";
    }
  };

  applySize();
  body.style.overflow = "hidden";
  window.scrollTo(0, 1);

  if (viewportFallbackInitialized) return;

  window.addEventListener("resize", applySize, { passive: true });
  window.addEventListener(
    "orientationchange",
    () => {
      window.setTimeout(applySize, 200);
    },
    { passive: true }
  );
  viewportFallbackInitialized = true;
}

async function tryRequestFullscreen(target: LegacyFullscreenElement) {
  const requests: Array<(() => Promise<void> | void) | undefined> = [
    target.requestFullscreen?.bind(target),
    target.webkitRequestFullscreen?.bind(target),
    target.webkitRequestFullScreen?.bind(target),
    target.mozRequestFullScreen?.bind(target),
    target.msRequestFullscreen?.bind(target),
  ];

  for (const request of requests) {
    if (!request) continue;
    try {
      await request();
      return true;
    } catch {
      // Try the next fullscreen variant.
    }
  }

  return false;
}

export async function requestFullscreen(element: HTMLElement) {
  const primaryTarget = element as LegacyFullscreenElement;
  const rootTarget = document.documentElement as LegacyFullscreenElement;

  if (await tryRequestFullscreen(primaryTarget)) return true;
  if (primaryTarget !== rootTarget && (await tryRequestFullscreen(rootTarget))) return true;

  if (isIOSWebKit()) {
    applyViewportFillFallback();
  }

  return false;
}

export function isFullscreenActive() {
  const doc = document as LegacyFullscreenDocument;
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export async function exitFullscreen() {
  const doc = document as LegacyFullscreenDocument;
  const exits: Array<(() => Promise<void> | void) | undefined> = [
    document.exitFullscreen?.bind(document),
    doc.webkitExitFullscreen?.bind(doc),
    doc.msExitFullscreen?.bind(doc),
  ];

  for (const exit of exits) {
    if (!exit) continue;
    try {
      await exit();
      return true;
    } catch {
      // Try the next fullscreen exit variant.
    }
  }

  return false;
}
