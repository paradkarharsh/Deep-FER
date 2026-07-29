import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Pause,
  Square,
  Circle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useWebcam } from "@/lib/hooks";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  getEmotionLabel,
  getEmotionColor,
  formatConfidence,
} from "@/lib/utils";
import type { FacePrediction, PredictionResponse } from "@/lib/api";

const ANALYSIS_INTERVAL_MS = 500;
const HISTORY_SAVE_INTERVAL_MS = 2500; // Save frame to history every 2.5 seconds max

export default function LiveCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastHistorySaveRef = useRef<number>(0);
  const lastEmotionRef = useRef<string>("");

  const webcam = useWebcam(videoRef);
  const { addHistory } = useAppStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<PredictionResponse | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  }, []);

  const startAnalysis = useCallback(() => {
    if (analysisRef.current) return;
    setIsAnalyzing(true);

    analysisRef.current = setInterval(async () => {
      const base64 = captureFrame();
      if (!base64) return;

      try {
        const response = await api.predictFrame(base64);
        setCurrentResult(response);
        setFrameCount((c) => c + 1);

        if (response.faces.length > 0) {
          const face = response.faces[0];
          const now = Date.now();
          const emotionChanged = face.emotion !== lastEmotionRef.current;
          const timeElapsed = now - lastHistorySaveRef.current > HISTORY_SAVE_INTERVAL_MS;

          if (emotionChanged || timeElapsed) {
            lastHistorySaveRef.current = now;
            lastEmotionRef.current = face.emotion;

            addHistory({
              emotion: face.emotion,
              confidence: face.confidence,
              imageThumbnail: `data:image/jpeg;base64,${base64}`,
              probabilities: face.probabilities,
            });
          }
        }
      } catch {
        /* Ignore frame errors silently */
      }
    }, ANALYSIS_INTERVAL_MS);
  }, [captureFrame, addHistory]);

  const stopAnalysis = useCallback(() => {
    if (analysisRef.current) {
      clearInterval(analysisRef.current);
      analysisRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (analysisRef.current) clearInterval(analysisRef.current);
    };
  }, []);

  const handleStart = useCallback(async () => {
    await webcam.start();
    startAnalysis();
  }, [webcam, startAnalysis]);

  const handleStop = useCallback(() => {
    stopAnalysis();
    webcam.stop();
    setCurrentResult(null);
    setFrameCount(0);
  }, [webcam, stopAnalysis]);

  const handlePause = useCallback(() => {
    if (webcam.isPaused) {
      webcam.resume();
      startAnalysis();
    } else {
      webcam.pause();
      stopAnalysis();
    }
  }, [webcam, startAnalysis, stopAnalysis]);

  const topFace: FacePrediction | null = currentResult?.faces[0] ?? null;

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title="Camera"
        description="Real-time facial emotion detection"
      />

      <div className="apple-card overflow-hidden mb-4 relative" style={{ minHeight: 300 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full object-cover"
          style={{
            display: webcam.isActive ? "block" : "none",
            maxHeight: 420,
            background: "var(--bg-tertiary)",
          }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!webcam.isActive && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Camera
              className="h-12 w-12 mb-4"
              strokeWidth={1.5}
              style={{ color: "var(--label-tertiary)" }}
            />
            <p className="text-headline mb-1" style={{ color: "var(--label-primary)" }}>
              Camera Preview
            </p>
            <p className="text-footnote text-center" style={{ color: "var(--label-secondary)" }}>
              Start the camera to begin real-time analysis
            </p>
          </div>
        )}

        {webcam.isActive && isAnalyzing && (
          <div
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-caption-1 font-semibold text-white">LIVE</span>
          </div>
        )}

        {webcam.error && (
          <div className="p-4 text-center">
            <p className="text-subheadline" style={{ color: "var(--system-red)" }}>
              {webcam.error}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        {!webcam.isActive ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
            className="px-6 py-3 rounded-full text-headline font-semibold text-white flex items-center gap-2"
            style={{ background: "var(--accent)" }}
          >
            <Camera className="h-5 w-5" />
            Start Camera
          </motion.button>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handlePause}
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: "var(--fill-tertiary)",
                color: "var(--label-primary)",
              }}
            >
              {webcam.isPaused ? <Circle className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleStop}
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--system-red)", color: "white" }}
            >
              <Square className="h-4 w-4" />
            </motion.button>
          </>
        )}
      </div>

      {webcam.isActive && (
        <div className="flex gap-3 mb-4">
          <div className="apple-card p-4 flex-1 text-center">
            <p className="text-caption-1 uppercase mb-1" style={{ color: "var(--label-secondary)", letterSpacing: "0.04em", fontWeight: 600 }}>
              FPS
            </p>
            <p className="text-title-3 tabular-nums" style={{ color: "var(--label-primary)" }}>
              {webcam.fps}
            </p>
          </div>
          <div className="apple-card p-4 flex-1 text-center">
            <p className="text-caption-1 uppercase mb-1" style={{ color: "var(--label-secondary)", letterSpacing: "0.04em", fontWeight: 600 }}>
              Frames
            </p>
            <p className="text-title-3 tabular-nums" style={{ color: "var(--label-primary)" }}>
              {frameCount}
            </p>
          </div>
          <div className="apple-card p-4 flex-1 text-center">
            <p className="text-caption-1 uppercase mb-1" style={{ color: "var(--label-secondary)", letterSpacing: "0.04em", fontWeight: 600 }}>
              Faces
            </p>
            <p className="text-title-3 tabular-nums" style={{ color: "var(--label-primary)" }}>
              {currentResult?.faces.length ?? 0}
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {topFace && (
          <motion.div
            key={topFace.detection_id ?? "live-top-face"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="apple-card p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: getEmotionColor(topFace.emotion) }}
              />
              <span className="text-title-3 flex-1" style={{ color: "var(--label-primary)" }}>
                {getEmotionLabel(topFace.emotion)}
              </span>
              <span className="text-title-2 tabular-nums" style={{ color: "var(--label-primary)" }}>
                {formatConfidence(topFace.confidence)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
