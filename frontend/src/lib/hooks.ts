import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type RefObject,
} from "react";

/* ------------------------------------------------------------------ */
/*  useWebcam                                                          */
/* ------------------------------------------------------------------ */

interface UseWebcamReturn {
  isActive: boolean;
  isPaused: boolean;
  fps: number;
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  error: string | null;
}

export function useWebcam(videoRef: RefObject<HTMLVideoElement | null>): UseWebcamReturn {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setIsPaused(false);

      /* FPS counter */
      frameCountRef.current = 0;
      fpsIntervalRef.current = setInterval(() => {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
      }, 1000);

      /* Count frames via requestVideoFrameCallback where supported */
      const video = videoRef.current;
      if (video && "requestVideoFrameCallback" in video) {
        const countFrame = () => {
          frameCountRef.current += 1;
          if (streamRef.current?.active) {
            (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => void })
              .requestVideoFrameCallback(countFrame);
          }
        };
        (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => void })
          .requestVideoFrameCallback(countFrame);
      }
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access was denied. Please allow camera permissions."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "No camera found on this device."
            : `Failed to access camera: ${err instanceof Error ? err.message : String(err)}`;
      setError(message);
      setIsActive(false);
    }
  }, [videoRef]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
    setIsActive(false);
    setIsPaused(false);
    setFps(0);
  }, [videoRef]);

  const pause = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getVideoTracks()) {
        track.enabled = false;
      }
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getVideoTracks()) {
        track.enabled = true;
      }
      setIsPaused(false);
    }
  }, []);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
      }
    };
  }, []);

  return { isActive, isPaused, fps, start, stop, pause, resume, error };
}

/* ------------------------------------------------------------------ */
/*  useAnimatedCounter                                                 */
/* ------------------------------------------------------------------ */

export function useAnimatedCounter(end: number, duration: number = 1000): number {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      /* Ease-out cubic */
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  useLocalStorage                                                    */
/* ------------------------------------------------------------------ */

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* Storage full or blocked — ignore */
        }
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}

/* ------------------------------------------------------------------ */
/*  useMediaQuery                                                      */
/* ------------------------------------------------------------------ */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/* ------------------------------------------------------------------ */
/*  useKeyboardShortcut                                                */
/* ------------------------------------------------------------------ */

export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    enabled?: boolean;
  } = {},
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { ctrl = false, shift = false, alt = false, meta = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (ctrl && !event.ctrlKey) return;
      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;
      if (meta && !event.metaKey) return;

      /* Don't fire inside editable elements unless modifier keys are used */
      const target = event.target as HTMLElement;
      const isEditable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isEditable && !(ctrl || meta || alt)) return;

      event.preventDefault();
      callbackRef.current(event);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, ctrl, shift, alt, meta, enabled]);
}
