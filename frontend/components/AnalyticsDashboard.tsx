"use client";

import { useEffect, useState, Fragment } from "react";
import { LineChart, BarChart2, CheckSquare, Zap, Activity } from "lucide-react";

interface HistoryData {
  loss: number[];
  accuracy: number[];
  val_loss: number[];
  val_accuracy: number[];
}

interface ModelMetricDetail {
  name: string;
  accuracy: number;
  loss: number;
  precision: number;
  recall: number;
  f1: number;
  history: HistoryData;
  confusion_matrix: number[][];
}

interface AnalyticsData {
  model_metrics: {
    perceptron: ModelMetricDetail;
    ann: ModelMetricDetail;
    cnn: ModelMetricDetail;
  };
  database_stats: {
    total_predictions: number;
    predictions_by_source: Record<string, number>;
    class_distribution: Record<string, number>;
    error_count: number;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<"perceptron" | "ann" | "cnn">("cnn");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/metrics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/5 rounded-2xl glass h-96">
        <Activity className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
        <p className="text-slate-400 text-sm">Loading historical runs and dashboard analytics...</p>
      </div>
    );
  }

  const currentMetrics = data.model_metrics[activeModel];
  const matrix = currentMetrics.confusion_matrix;
  
  // Custom SVG line chart plotting helper
  const drawLineChartPath = (values: number[], minVal: number, maxVal: number, width: number, height: number) => {
    if (values.length === 0) return "";
    const padding = 10;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    const dx = chartWidth / (values.length - 1);
    
    const points = values.map((val, i) => {
      const x = padding + i * dx;
      // Invert Y because SVG (0,0) is top-left
      const ratio = (val - minVal) / (maxVal - minVal || 1);
      const y = padding + chartHeight * (1 - ratio);
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  };

  const getMinMax = (arr1: number[], arr2: number[]) => {
    const combined = [...arr1, ...arr2];
    const max = Math.max(...combined);
    const min = Math.min(...combined);
    // Pad values a little bit
    const diff = max - min || 1;
    return { min: Math.max(0, min - 0.1 * diff), max: max + 0.1 * diff };
  };

  const accBounds = getMinMax(currentMetrics.history.accuracy, currentMetrics.history.val_accuracy);
  const lossBounds = getMinMax(currentMetrics.history.loss, currentMetrics.history.val_loss);

  // Maximum value in confusion matrix to scale grid cell opacity
  const maxMatrixVal = matrix ? Math.max(...matrix.map((row) => Math.max(...row))) : 1;

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total sandbox predictions */}
        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 h-16 w-16 bg-cyan-500/5 rounded-bl-full filter blur-lg" />
          <span className="text-[10px] text-slate-500 font-mono uppercase">Interactive Runs</span>
          <div className="text-3xl font-black text-white mt-1.5 font-mono">
            {data.database_stats.total_predictions.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1.5">
            <BarChart2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Total user predictions logged</span>
          </div>
        </div>

        {/* Card 2: Accuracy */}
        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/5 rounded-bl-full filter blur-lg" />
          <span className="text-[10px] text-slate-500 font-mono uppercase">Accuracy Score</span>
          <div className="text-3xl font-black text-cyan-400 mt-1.5 font-mono">
            {(currentMetrics.accuracy * 100).toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1.5">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>Validation set accuracy</span>
          </div>
        </div>

        {/* Card 3: F1-Score */}
        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 h-16 w-16 bg-rose-500/5 rounded-bl-full filter blur-lg" />
          <span className="text-[10px] text-slate-500 font-mono uppercase">F1 Metric (Macro)</span>
          <div className="text-3xl font-black text-violet-400 mt-1.5 font-mono">
            {(currentMetrics.f1 * 100).toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1.5">
            <LineChart className="h-3.5 w-3.5 text-violet-400" />
            <span>Precision-Recall harmonic mean</span>
          </div>
        </div>

        {/* Card 4: Incorrect predictions flagged */}
        <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full filter blur-lg" />
          <span className="text-[10px] text-slate-500 font-mono uppercase">Errors Logged</span>
          <div className="text-3xl font-black text-rose-500 mt-1.5 font-mono">
            {data.database_stats.error_count.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1.5">
            <CheckSquare className="h-3.5 w-3.5 text-rose-400" />
            <span>Flagged incorrect classifications</span>
          </div>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex justify-between items-center bg-slate-950/80 border border-white/5 p-1 rounded-2xl self-start">
        {["perceptron", "ann", "cnn"].map((m) => (
          <button
            key={m}
            onClick={() => setActiveModel(m as any)}
            className={`px-5 py-2 text-xs font-mono rounded-xl transition-all cursor-pointer ${
              activeModel === m
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {m.toUpperCase()} RUN
          </button>
        ))}
      </div>

      {/* Graphs & Matrix Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Confusion Matrix Card */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase mb-6 flex items-center space-x-2">
            <BarChart2 className="h-5 w-5 text-cyan-400" />
            <span>Confusion Matrix</span>
          </h3>

          <div className="flex flex-col items-center">
            {/* The Matrix Grid */}
            <div className="grid grid-cols-11 gap-1 w-full max-w-sm mb-6">
              {/* Header Label Column placeholder */}
              <div className="text-center font-mono text-[9px] text-slate-600 flex items-center justify-center font-bold">Act\Pred</div>
              {/* Column labels */}
              {Array.from({ length: 10 }).map((_, colIdx) => (
                <div key={colIdx} className="text-center font-mono text-xs text-slate-400 flex items-center justify-center font-bold">
                  {colIdx}
                </div>
              ))}

              {/* Rows */}
              {matrix.map((row, rowIdx) => (
                <Fragment key={`matrix-row-${rowIdx}`}>
                  {/* Row label */}
                  <div className="text-center font-mono text-xs text-slate-400 flex items-center justify-center font-bold">
                    {rowIdx}
                  </div>
                  {/* Cell grid */}
                  {row.map((cellVal, colIdx) => {
                    const ratio = cellVal / maxMatrixVal;
                    const isDiagonal = rowIdx === colIdx;
                    // Dark theme cyber coloring: diagonal cells glow cyan/emerald, off-diagonal errors glow rose
                    let cellColor = `rgba(30, 41, 59, ${0.1 + 0.3 * ratio})`;
                    if (isDiagonal) {
                      cellColor = `rgba(6, 182, 212, ${0.15 + 0.8 * ratio})`;
                    } else if (cellVal > 0) {
                      cellColor = `rgba(244, 63, 94, ${0.1 + 0.7 * ratio})`;
                    }

                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        title={`Actual ${rowIdx}, Predicted ${colIdx}: ${cellVal}`}
                        className={`aspect-square rounded border border-white/5 flex items-center justify-center text-[9px] font-mono font-bold transition-all hover:scale-110 cursor-pointer ${
                          isDiagonal ? "text-white" : cellVal > 0 ? "text-rose-300" : "text-slate-600"
                        }`}
                        style={{ backgroundColor: cellColor }}
                      >
                        {cellVal > 999 ? `${(cellVal/1000).toFixed(1)}k` : cellVal}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              Rows represent the actual classes in the MNIST dataset. Columns represent the predictions generated by the network. Heavy diagonal values indicate high classification accuracy.
            </p>
          </div>
        </div>

        {/* Training Curves Card */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase mb-6 flex items-center space-x-2">
              <LineChart className="h-5 w-5 text-cyan-400" />
              <span>Training Analytics Curves</span>
            </h3>
            
            {/* Visual Plots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Curve 1: Accuracy */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-3">Accuracy History</span>
                <svg viewBox="0 0 100 100" className="w-full max-w-[150px] aspect-square overflow-visible">
                  {/* Grid Lines */}
                  <line x1="10" y1="10" x2="90" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="10" y1="90" x2="90" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  
                  {/* Train path */}
                  <path
                    d={drawLineChartPath(currentMetrics.history.accuracy, accBounds.min, accBounds.max, 100, 100)}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Val path */}
                  <path
                    d={drawLineChartPath(currentMetrics.history.val_accuracy, accBounds.min, accBounds.max, 100, 100)}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex space-x-4 mt-3 text-[9px] font-mono">
                  <div className="flex items-center space-x-1">
                    <span className="h-1.5 w-3 bg-violet-500 rounded" />
                    <span className="text-slate-400">Train</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-1.5 w-3 bg-cyan-400 rounded-sm border-dashed" style={{ borderStyle: "dashed" }} />
                    <span className="text-slate-400">Val</span>
                  </div>
                </div>
              </div>

              {/* Curve 2: Loss */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-3">Loss History</span>
                <svg viewBox="0 0 100 100" className="w-full max-w-[150px] aspect-square overflow-visible">
                  {/* Grid Lines */}
                  <line x1="10" y1="10" x2="90" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="10" y1="90" x2="90" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

                  {/* Train path */}
                  <path
                    d={drawLineChartPath(currentMetrics.history.loss, lossBounds.min, lossBounds.max, 100, 100)}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Val path */}
                  <path
                    d={drawLineChartPath(currentMetrics.history.val_loss, lossBounds.min, lossBounds.max, 100, 100)}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex space-x-4 mt-3 text-[9px] font-mono">
                  <div className="flex items-center space-x-1">
                    <span className="h-1.5 w-3 bg-violet-500 rounded" />
                    <span className="text-slate-400">Train</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-1.5 w-3 bg-cyan-400 rounded-sm" />
                    <span className="text-slate-400">Val</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center leading-relaxed mt-6">
            Loss and Accuracy training metrics plotted over 5 learning epochs. Shows convergence of the network and highlights if overfitting occurred.
          </p>
        </div>
      </div>
    </div>
  );
}
