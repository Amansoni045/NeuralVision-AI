"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Trash2, BrainCircuit } from "lucide-react";
import { API_BASE_URL } from "../config";
import type { XAIPredictionData } from "./XAIModule";
import { animateDrawing } from "../utils/demoSession";
import { useBackend } from "./BackendStatusProvider";

interface CanvasProps {
  onPredict: (data: XAIPredictionData) => void;
  selectedModel: string;
}

interface InferenceResponse extends XAIPredictionData {
  predicted_class: number;
  confidence: number;
  all_confidences: number[];
  latency_ms: number;
  prediction_id?: number;
}

export interface CanvasRef {
  clear: () => void;
  startDemo: (onComplete: () => void) => void;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ onPredict, selectedModel }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { status, elapsedSeconds, checkStatus } = useBackend();
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confidences, setConfidences] = useState<number[]>(new Array(10).fill(0));
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [brushSize, setBrushSize] = useState(16);
  const [predictionId, setPredictionId] = useState<number | null>(null);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [submittingCorrect, setSubmittingCorrect] = useState(false);

  // Throttled real-time prediction
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    resetCanvasWithHint();
  }, []);

  const resetCanvasWithHint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background with black for MNIST compatibility
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw dotted trace guide "3"
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    // Centered digit "3" shape
    ctx.moveTo(95, 80);
    ctx.bezierCurveTo(165, 50, 215, 100, 140, 140);
    ctx.bezierCurveTo(215, 175, 165, 240, 95, 210);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    setHasDrawn(false);
    setPrediction(null);
    setConfidence(null);
    setConfidences(new Array(10).fill(0));
    setLatency(null);
    setPredictionId(null);
    setIsCorrecting(false);
    setSubmittingCorrect(false);
  };

  const prepareForDrawing = () => {
    if (!hasDrawn) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Clear the dotted hint before user draws
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(true);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    // Support touch events
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Map visual client coordinates to internal canvas resolution pixels (280x280)
    const x = ((clientX - rect.left) * canvas.width) / (rect.width || 1);
    const y = ((clientY - rect.top) * canvas.height) / (rect.height || 1);

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    prepareForDrawing();
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#FFFFFF"; // Drawing in white ink

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    // Trigger real-time prediction with throttle (without explain features)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      triggerPrediction(false);
    }, 120); // Fast throttled updates
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    triggerPrediction(true); // Full prediction with explain features
  };

  const clearCanvas = () => {
    resetCanvasWithHint();
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    clear() {
      clearCanvas();
    },
    startDemo(onComplete: () => void) {
      clearCanvas();
      setHasDrawn(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear layout and trace digit "3"
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animateDrawing(
        ctx,
        brushSize,
        () => {
          // Programmatic real-time prediction call
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            triggerPrediction(false);
          }, 120);
        },
        async () => {
          // Finish and trigger final prediction with explanations
          await triggerPrediction(true);
          onComplete();
        }
      );
    }
  }));

  const triggerPrediction = async (shouldExplain: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Extract image as base64 data URI
    const dataUrl = canvas.toDataURL("image/png");

    // Don't predict empty canvas (if it's purely black or unchanged hint)
    if (!hasDrawn) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/predict/canvas`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          image_data: dataUrl,
          source: "canvas",
          model_type: selectedModel,
          explain: shouldExplain
        })
      });

      if (!response.ok) throw new Error("Prediction API error");

      const data = (await response.json()) as InferenceResponse;
      data.image_data = dataUrl;
      setPrediction(data.predicted_class);
      setConfidence(data.confidence);
      setConfidences(data.all_confidences);
      setLatency(data.latency_ms);
      setPredictionId(data.prediction_id || null);
      onPredict(data); // Propagate prediction up
    } catch (err) {
      console.error("Canvas prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagCorrection = async (actualVal: number) => {
    if (!predictionId) return;
    setSubmittingCorrect(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_BASE_URL}/api/v1/metrics/correct`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prediction_id: predictionId,
          actual_label: actualVal,
          is_battle_arena: false
        })
      });

      if (response.ok) {
        setIsCorrecting(false);
        setPrediction(actualVal);
      }
    } catch (err) {
      console.error("Error flagging correction:", err);
    } finally {
      setSubmittingCorrect(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full">
      {/* Canvas Block */}
      <div className="flex flex-col items-center">
        <div className={`relative p-2.5 rounded-2xl glass border transition-all duration-300 ${loading ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-white/10 glow-pulse'}`}>
          {(status === "offline" || status === "sleeping" || status === "checking") && (
            <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 backdrop-blur-sm">
              {status === "checking" && (
                <>
                  <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-300">Connecting to AI server...</p>
                </>
              )}
              {status === "sleeping" && (
                <>
                  <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mb-3" />
                  <p className="text-xs font-semibold text-amber-400 mb-1">AI Server is Waking Up</p>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[220px]">
                    To save energy, our server sleeps when inactive. It is starting up now—this takes about 50 seconds.
                  </p>
                  <span className="mt-3 text-xs font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                    Waking up: {elapsedSeconds}s
                  </span>
                </>
              )}
              {status === "offline" && (
                <>
                  <div className="h-8 w-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
                    <span className="h-3 w-3 bg-rose-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-xs font-semibold text-rose-400 mb-1">AI Server Offline</p>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[220px]">
                    The server is currently offline. Please try starting the server if running locally.
                  </p>
                  <button
                    onClick={() => checkStatus(true)}
                    className="mt-3.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all text-[10px] font-semibold cursor-pointer"
                  >
                    Try Reconnecting
                  </button>
                </>
              )}
            </div>
          )}
          {!hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/5 shadow-xl animate-pulse">
                Draw here
              </span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="rounded-xl cursor-crosshair bg-black touch-none max-w-full h-auto aspect-square select-none"
          />
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center space-x-6 mt-4 w-full justify-between px-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Brush:</span>
            <input
              type="range"
              min="8"
              max="28"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs text-slate-300 font-mono">{brushSize}px</span>
          </div>

          <button
            onClick={clearCanvas}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs text-slate-300 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/20 rounded-lg transition-all cursor-pointer bg-slate-900/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Real-time confidence distribution bars */}
      <div className="flex flex-col w-full max-w-sm glass p-4 sm:p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Inference Output</h3>
          </div>
          {latency && (
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono border border-cyan-800/30">
              {latency.toFixed(2)} ms
            </span>
          )}
        </div>

        {/* Main Prediction Display */}
        <div className="flex items-center justify-between mb-6 gap-2">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center border border-white/10 relative">
              <span className="text-5xl font-black text-white tracking-tighter">
                {prediction !== null ? prediction : "-"}
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-400">Class Confidence</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                {confidence !== null ? `${(confidence * 100).toFixed(1)}%` : "0.0%"}
              </div>
            </div>
          </div>
          
          {prediction !== null && predictionId && !isCorrecting && (
            <button
              onClick={() => setIsCorrecting(true)}
              className="px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer"
            >
              Correct Digit
            </button>
          )}
        </div>

        {/* Dynamic Correction Grid */}
        {isCorrecting && (
          <div className="border-t border-white/5 pt-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-[10px] text-slate-500 uppercase font-mono block mb-2">Identify actual digit:</span>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleFlagCorrection(i)}
                  disabled={submittingCorrect}
                  className="py-1.5 text-xs font-mono font-bold rounded bg-slate-950/80 border border-white/5 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-colors cursor-pointer"
                >
                  {i}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsCorrecting(false)}
              className="w-full text-center py-1 text-[9px] font-mono text-slate-500 hover:text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* 10-Class Confidence Progress Bars */}
        <div className="space-y-2">
          {confidences.map((conf, index) => {
            const isPredicted = prediction === index;
            return (
              <div key={index} className="flex items-center space-x-2.5">
                <span className={`w-3 text-xs font-mono font-bold ${isPredicted ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {index}
                </span>
                <div className="flex-1 h-2 bg-slate-900/80 rounded border border-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-r transition-all duration-300 ${
                      isPredicted 
                        ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                        : 'bg-slate-700/60'
                    }`}
                    style={{ width: `${conf * 100}%` }}
                  />
                </div>
                <span className={`w-9 text-right text-[10px] font-mono ${isPredicted ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                  {(conf * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;
