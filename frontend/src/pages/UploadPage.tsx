import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import type { FacePrediction, PredictionResponse } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { formatTime, getEmotionColor } from "@/lib/utils";
import EmotionResultCard from "@/components/shared/EmotionResultCard";
import ConfidenceChart from "@/components/shared/ConfidenceChart";
import { PageHeader } from "@/components/layout/PageHeader";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="scan-line" />
      <div className="flex flex-col items-center gap-3 z-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full"
          style={{ border: "2px solid var(--separator)", borderTopColor: "var(--accent)" }}
        />
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-footnote font-semibold uppercase"
          style={{ color: "white", letterSpacing: "0.08em" }}
        >
          Analyzing…
        </motion.p>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [selectedFace, setSelectedFace] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { addHistory } = useAppStore();

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError(null);
      setSelectedFace(0);
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp"] },
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const [response, dataUrl] = await Promise.all([
        api.predictImage(file),
        fileToDataURL(file).catch(() => preview ?? ""),
      ]);

      setResult(response);
      setSelectedFace(0);

      if (response.faces.length > 0) {
        const face = response.faces[0];
        addHistory({
          emotion: face.emotion,
          confidence: face.confidence,
          imageThumbnail: dataUrl,
          probabilities: face.probabilities,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  }, [file, preview, addHistory]);

  const handleClear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setSelectedFace(0);
  }, [preview]);

  const currentFace: FacePrediction | null = result?.faces[selectedFace] ?? null;

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        title="Upload"
        description="Drop an image to analyze facial emotions"
      />

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div
              {...getRootProps()}
              className="apple-card flex flex-col items-center justify-center p-12 cursor-pointer transition-all duration-200"
              style={{
                border: isDragActive
                  ? "2px dashed var(--accent)"
                  : "2px dashed var(--separator)",
                minHeight: 280,
              }}
            >
              <input {...getInputProps()} />
              <Upload
                className="h-12 w-12 mb-4"
                strokeWidth={1.5}
                style={{ color: isDragActive ? "var(--accent)" : "var(--label-tertiary)" }}
              />
              <p
                className="text-headline mb-1"
                style={{ color: "var(--label-primary)" }}
              >
                {isDragActive ? "Drop image here" : "Drop image or tap to browse"}
              </p>
              <p
                className="text-footnote"
                style={{ color: "var(--label-secondary)" }}
              >
                PNG, JPG, WEBP up to 10 MB
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="apple-card overflow-hidden mb-4 relative">
              <img
                src={preview ?? ""}
                alt="Uploaded"
                className="w-full max-h-[400px] object-contain"
                style={{ background: "var(--bg-tertiary)" }}
              />
              {isProcessing && <ProcessingOverlay />}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <ImageIcon className="h-4 w-4 shrink-0" style={{ color: "var(--label-secondary)" }} />
                <span className="text-footnote truncate" style={{ color: "var(--label-secondary)" }}>
                  {file.name} · {formatFileSize(file.size)}
                </span>
              </div>

              {!isProcessing && !result && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAnalyze}
                  className="px-5 py-2.5 rounded-xl text-subheadline font-semibold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  Analyze
                </motion.button>
              )}

              <button
                onClick={handleClear}
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--fill-tertiary)", color: "var(--label-secondary)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="apple-card p-4 flex items-center gap-3 mb-6"
              >
                <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "var(--system-red)" }} />
                <p className="text-subheadline" style={{ color: "var(--system-red)" }}>
                  {error}
                </p>
              </motion.div>
            )}

            {result && currentFace && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1.0, 0.36, 1] }}
              >
                {result.faces.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {result.faces.map((face, i) => (
                      <button
                        key={face.detection_id ?? `face-${i}`}
                        onClick={() => setSelectedFace(i)}
                        className="px-4 py-2 rounded-xl text-footnote font-medium transition-colors"
                        style={{
                          background: i === selectedFace ? "var(--accent)" : "var(--fill-tertiary)",
                          color: i === selectedFace ? "white" : "var(--label-primary)",
                        }}
                      >
                        Face {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                <p
                  className="text-caption-1 mb-4"
                  style={{ color: "var(--label-tertiary)" }}
                >
                  Processed in {formatTime(result.processing_time_ms)} · {result.faces.length} face{result.faces.length !== 1 ? "s" : ""} detected
                </p>

                <div className="space-y-4">
                  <EmotionResultCard
                    emotion={currentFace.emotion}
                    confidence={currentFace.confidence}
                    description={currentFace.description}
                    color={getEmotionColor(currentFace.emotion)}
                    detection_id={currentFace.detection_id ?? result.detection_id}
                  />
                  <ConfidenceChart probabilities={currentFace.probabilities} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
