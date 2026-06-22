"use client";

import { useRef, useState, useEffect } from "react";
import { Trash2, BrainCircuit } from "lucide-react";
import { API_BASE_URL } from "../config";

import type { XAIPredictionData } from "./XAIModule";

interface CanvasProps {
  onPredict: (data: XAIPredictionData) => void;
  selectedModel: string;
}

interface InferenceResponse extends XAIPredictionData {
  predicted_class: number;
  confidence: number;
  all_confidences: number[];
  latency_ms: number;
}

export default function Canvas({ onPredict, selectedModel }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confidences, setConfidences] = useState<number[]>(new Array(10).fill(0));
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [brushSize, setBrushSize] = useState(16);

  // Throttled real-time prediction
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background with black for MNIST compatibility (white digit on black)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Support touch events
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
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

    // Trigger real-time prediction with throttle
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      triggerPrediction();
    }, 150); // Throttled at 150ms
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    triggerPrediction();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setPrediction(null);
    setConfidence(null);
    setConfidences(new Array(10).fill(0));
    setLatency(null);
  };

  const triggerPrediction = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Extract image as base64 data URI
    const dataUrl = canvas.toDataURL("image/png");

    // Don't predict empty canvas (if it's purely black)
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasDrawn = false;
    for (let i = 0; i < imgData.length; i += 4) {
      if (imgData[i] > 10) { // Check if there's any non-black pixel
        hasDrawn = true;
        break;
      }
    }
    if (!hasDrawn) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/predict/canvas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data: dataUrl,
          source: "canvas",
          model_type: selectedModel
        })
      });

      if (!response.ok) throw new Error("Prediction API error");

      const data = (await response.json()) as InferenceResponse;
      setPrediction(data.predicted_class);
      setConfidence(data.confidence);
      setConfidences(data.all_confidences);
      setLatency(data.latency_ms);
      onPredict(data); // Propagate prediction up (for Grad-CAM, activations, history, etc.)
    } catch (err) {
      print("Canvas prediction error:", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full">
      {/* Canvas Block */}
      <div className="flex flex-col items-center">
        <div className="relative p-2.5 rounded-2xl glass border border-white/10 glow-pulse">
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
            className="rounded-xl cursor-crosshair bg-black touch-none"
          />
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center space-x-6 mt-4 w-full justify-between px-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Brush Size:</span>
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
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs text-slate-300 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/20 rounded-lg transition-all cursor-pointer bg-slate-900/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Real-time confidence distribution bars */}
      <div className="flex flex-col w-full max-w-sm glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
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
        <div className="flex items-center space-x-6 mb-6">
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
}

// Print helper since we used "print"
function print(...args: unknown[]) {
  console.log(...args);
}
