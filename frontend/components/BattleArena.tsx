"use client";

import { useRef, useState, useEffect } from "react";
import { Trash2, ShieldAlert, Cpu, Gauge, Layers } from "lucide-react";

interface ModelArenaDetail {
  predicted_class: number;
  confidence: number;
  all_confidences: number[];
  latency_ms: number;
}

interface BattleResult {
  perceptron: ModelArenaDetail;
  ann: ModelArenaDetail;
  cnn: ModelArenaDetail;
  log_id: number;
}

export default function BattleArena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(16);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BattleResult | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);

  // Load model structures on mount
  useEffect(() => {
    fetchModelInfo();
    clearCanvas();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/model-info");
      if (res.ok) {
        const data = await res.json();
        setModelInfo(data);
      }
    } catch (err) {
      console.error("Error fetching model metadata:", err);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
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
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    triggerBattlePrediction();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setResults(null);
  };

  const triggerBattlePrediction = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");

    // Don't predict empty canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasDrawn = false;
    for (let i = 0; i < imgData.length; i += 4) {
      if (imgData[i] > 10) {
        hasDrawn = true;
        break;
      }
    }
    if (!hasDrawn) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/predict/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data: dataUrl,
          source: "canvas"
        })
      });

      if (!response.ok) throw new Error("Arena prediction error");

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Battle prediction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricBadge = (val: number) => {
    if (val >= 0.97) return "bg-emerald-950 text-emerald-400 border border-emerald-800/30";
    if (val >= 0.95) return "bg-cyan-950 text-cyan-400 border border-cyan-800/30";
    return "bg-amber-950 text-amber-400 border border-amber-800/30";
  };

  const getLatencyBadge = (val: number) => {
    if (val < 15) return "bg-emerald-950 text-emerald-400 border border-emerald-800/30";
    if (val < 35) return "bg-cyan-950 text-cyan-400 border border-cyan-800/30";
    return "bg-amber-950 text-amber-400 border border-amber-800/30";
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start justify-center w-full max-w-6xl">
      {/* Drawing Canvas */}
      <div className="flex flex-col items-center glass p-6 rounded-2xl border border-white/5 mx-auto xl:mx-0">
        <h3 className="text-sm font-semibold tracking-wide text-white uppercase mb-4 flex items-center space-x-2">
          <Cpu className="h-5 w-5 text-cyan-400" />
          <span>Draw Digit to Battle</span>
        </h3>

        <div className="relative p-2.5 rounded-xl bg-black border border-white/10 glow-pulse">
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
            className="rounded-lg cursor-crosshair bg-black touch-none"
          />
        </div>

        <div className="flex items-center justify-between w-full mt-4 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 uppercase">Brush:</span>
            <input
              type="range"
              min="8"
              max="28"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          <button
            onClick={clearCanvas}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/20 rounded-lg transition-all cursor-pointer bg-slate-900/50"
          >
            <Trash2 className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Battle Cards */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Model 1: Perceptron */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-500/5 rounded-bl-full filter blur-xl" />
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-mono">MODEL 01</span>
                <h4 className="text-lg font-bold text-white tracking-tight">Perceptron</h4>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${getMetricBadge(0.9070)}`}>
                90.7% Acc
              </span>
            </div>

            <div className="h-28 flex items-center justify-center bg-slate-950/60 rounded-xl border border-white/5 mb-4">
              {results ? (
                <div className="text-center">
                  <div className="text-5xl font-black text-white">{results.perceptron.predicted_class}</div>
                  <div className="text-xs text-cyan-400 mt-1 font-semibold">
                    {(results.perceptron.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
              ) : (
                <span className="text-slate-600 text-xs uppercase tracking-wider font-mono">Awaiting input</span>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5 text-slate-500" />
                  Latency:
                </span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${results ? getLatencyBadge(results.perceptron.latency_ms) : 'text-slate-500'}`}>
                  {results ? `${results.perceptron.latency_ms.toFixed(1)} ms` : "-"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  Params:
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {modelInfo?.perceptron?.total_parameters?.toLocaleString() || "7,850"}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-6 leading-relaxed">
            Single-layer linear classifier. Executes feedforward calculation in a single step. Fast, but lacks capability for non-linear structures.
          </div>
        </div>

        {/* Model 2: ANN */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-bl-full filter blur-xl" />
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-mono">MODEL 02</span>
                <h4 className="text-lg font-bold text-white tracking-tight">ANN (Dense)</h4>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${getMetricBadge(0.9755)}`}>
                97.5% Acc
              </span>
            </div>

            <div className="h-28 flex items-center justify-center bg-slate-950/60 rounded-xl border border-white/5 mb-4">
              {results ? (
                <div className="text-center">
                  <div className="text-5xl font-black text-white">{results.ann.predicted_class}</div>
                  <div className="text-xs text-cyan-400 mt-1 font-semibold">
                    {(results.ann.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
              ) : (
                <span className="text-slate-600 text-xs uppercase tracking-wider font-mono">Awaiting input</span>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5 text-slate-500" />
                  Latency:
                </span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${results ? getLatencyBadge(results.ann.latency_ms) : 'text-slate-500'}`}>
                  {results ? `${results.ann.latency_ms.toFixed(1)} ms` : "-"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  Params:
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {modelInfo?.ann?.total_parameters?.toLocaleString() || "109,386"}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-6 leading-relaxed">
            Multilayer Perceptron (MLP) with two dense layers (128 & 64 nodes) and ReLU activations. Captures complex non-linear combinations.
          </div>
        </div>

        {/* Model 3: CNN */}
        <div className="glass p-6 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-500/10 rounded-bl-full filter blur-xl" />
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">MODEL 03 (CHAMPION)</span>
                <h4 className="text-lg font-bold text-white tracking-tight">CNN</h4>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${getMetricBadge(0.9805)}`}>
                98.1% Acc
              </span>
            </div>

            <div className="h-28 flex items-center justify-center bg-cyan-950/10 rounded-xl border border-cyan-500/10 mb-4 shadow-[inset_0_0_12px_rgba(6,182,212,0.05)]">
              {results ? (
                <div className="text-center">
                  <div className="text-5xl font-black text-white">{results.cnn.predicted_class}</div>
                  <div className="text-xs text-cyan-400 mt-1 font-semibold">
                    {(results.cnn.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
              ) : (
                <span className="text-slate-600 text-xs uppercase tracking-wider font-mono">Awaiting input</span>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5 text-slate-500" />
                  Latency:
                </span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${results ? getLatencyBadge(results.cnn.latency_ms) : 'text-slate-500'}`}>
                  {results ? `${results.cnn.latency_ms.toFixed(1)} ms` : "-"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  Params:
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {modelInfo?.cnn?.total_parameters?.toLocaleString() || "119,978"}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-6 leading-relaxed">
            Convolutional Neural Network. Employs 2D feature filters and max pooling. Automatically extracts spatial translation-invariant shape features.
          </div>
        </div>
      </div>
    </div>
  );
}
