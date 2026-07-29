/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FacePrediction {
  bbox: BBox;
  emotion: string;
  confidence: number;
  probabilities: Record<string, number>;
  emoji: string;
  color: string;
  description: string;
  detection_id: string;
}

export interface PredictionResponse {
  detection_id: string;
  faces: FacePrediction[];
  processing_time_ms: number;
  image_dimensions: { w: number; h: number };
}

export interface ModelInfo {
  name: string;
  architecture: string;
  parameters: number;
  input_shape: string;
  classes: string[];
  accuracy: string;
  version: string;
  dataset: string;
  inference_device: string;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  version?: string;
  uptime_seconds?: number;
}

/* ------------------------------------------------------------------ */
/*  API Client                                                         */
/* ------------------------------------------------------------------ */

const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "http://localhost:8000");

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /* ---- internal helpers ------------------------------------------ */

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });
    } catch (error) {
      throw new Error(
        `Network error: unable to reach ${url}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = (await response.json()) as { detail?: string };
        if (body.detail) {
          detail = body.detail;
        }
      } catch {
        /* body wasn't JSON — fall through */
      }
      throw new Error(
        `API error ${response.status}: ${detail} (${options.method ?? "GET"} ${path})`,
      );
    }

    return response.json() as Promise<T>;
  }

  /* ---- public endpoints ------------------------------------------ */

  /**
   * Upload an image file for emotion prediction.
   */
  async predictImage(file: File): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request<PredictionResponse>("/api/predict", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Send a single webcam frame (base64-encoded) for emotion prediction.
   */
  async predictFrame(base64: string): Promise<PredictionResponse> {
    return this.request<PredictionResponse>("/api/predict-frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });
  }

  /**
   * Retrieve model metadata and capabilities.
   */
  async getModelInfo(): Promise<ModelInfo> {
    return this.request<ModelInfo>("/api/model-info");
  }

  /**
   * Simple health / readiness check.
   */
  async healthCheck(): Promise<HealthStatus> {
    return this.request<HealthStatus>("/api/health");
  }
}

/** Singleton API client instance. */
export const api = new ApiClient();

export { ApiClient };
