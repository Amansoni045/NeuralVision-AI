"use client";

import { useState, useEffect } from "react";
import { AlertCircle, ShieldAlert, SlidersHorizontal, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../config";

interface ErrorLog {
  id: number;
  image_data: string;
  model_type: string;
  predicted_label: number;
  actual_label: number;
  confidence: number;
  source: string;
  timestamp: string;
}

export default function ErrorExplorer() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [predictedFilter, setPredictedFilter] = useState<string>("all");
  const [actualFilter, setActualFilter] = useState<string>("all");
  
  // Correction dialog/state
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [correctValue, setCorrectValue] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redirect to dashboard if token exists
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/metrics`);
      if (res.ok) {
        const json = await res.json();
        setErrors(json.errors || []);
      }
    } catch (err) {
      console.error("Error fetching error explorer logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectLabel = async () => {
    if (!selectedError || correctValue === null) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/metrics/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prediction_id: selectedError.id,
          actual_label: correctValue,
          is_battle_arena: false
        })
      });

      if (response.ok) {
        // Refetch to update the list
        await fetchErrors();
        setSelectedError(null);
        setCorrectValue(null);
      } else {
        alert("Failed to submit label correction.");
      }
    } catch (err) {
      console.error("Error correcting label:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logs locally
  const filteredErrors = errors.filter((err) => {
    const matchesModel = modelFilter === "all" || err.model_type === modelFilter;
    const matchesPred = predictedFilter === "all" || err.predicted_label.toString() === predictedFilter;
    const matchesActual = actualFilter === "all" || err.actual_label.toString() === actualFilter;
    return matchesModel && matchesPred && matchesActual;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Filtering Header Toolbar */}
      <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="h-4.5 w-4.5 text-cyan-400" />
          <h4 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Filters</h4>
        </div>

        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          {/* Model Filter */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Model Type</span>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              aria-label="Filter by model type"
              className="bg-slate-950/80 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none cursor-pointer hover:border-cyan-500/20"
            >
              <option value="all">All Models</option>
              <option value="perceptron">Perceptron</option>
              <option value="ann">ANN (Dense)</option>
              <option value="cnn">CNN</option>
            </select>
          </div>

          {/* Predicted Filter */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Predicted Label</span>
            <select
              value={predictedFilter}
              onChange={(e) => setPredictedFilter(e.target.value)}
              aria-label="Filter by predicted label"
              className="bg-slate-950/80 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none cursor-pointer hover:border-cyan-500/20"
            >
              <option value="all">Any Predicted</option>
              {Array.from({ length: 10 }).map((_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Actual Filter */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Correct Label</span>
            <select
              value={actualFilter}
              onChange={(e) => setActualFilter(e.target.value)}
              aria-label="Filter by correct label"
              className="bg-slate-950/80 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none cursor-pointer hover:border-cyan-500/20"
            >
              <option value="all">Any Actual</option>
              {Array.from({ length: 10 }).map((_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchErrors}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-400 border border-slate-800/80 rounded-lg hover:border-cyan-500/20 transition-all cursor-pointer bg-slate-950/20 self-end"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center h-80">
          <RefreshCw className="h-8 w-8 text-slate-600 animate-spin" />
        </div>
      ) : filteredErrors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/5 rounded-2xl glass h-80">
          <AlertCircle className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No incorrect predictions matched your filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredErrors.map((err) => (
            <div
              key={err.id}
              onClick={() => {
                setSelectedError(err);
                setCorrectValue(err.actual_label || null);
              }}
              className="glass p-5 rounded-2xl border border-white/5 hover:border-cyan-500/20 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-950/80 border border-white/5 px-2 py-0.5 rounded">
                  {err.model_type}
                </span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">
                  {(err.confidence * 100).toFixed(0)}% Conf
                </span>
              </div>

              {/* Digit Box */}
              <div className="h-28 w-28 mx-auto rounded-xl bg-black border border-white/10 flex items-center justify-center p-2 mb-4 group-hover:border-cyan-500/30 transition-colors overflow-hidden">
                <img
                  src={err.image_data}
                  alt="Drawn digit"
                  className="max-h-full max-w-full object-contain rounded"
                />
              </div>

              {/* Prediction Labels Info */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="text-center flex-1">
                  <span className="text-[9px] text-rose-400 uppercase font-mono block">Predicted</span>
                  <span className="text-lg font-black text-rose-400">{err.predicted_label}</span>
                </div>
                <div className="text-slate-600 font-bold text-xs px-2">vs</div>
                <div className="text-center flex-1">
                  <span className="text-[9px] text-emerald-400 uppercase font-mono block">Corrected</span>
                  <span className="text-lg font-black text-emerald-400">
                    {err.actual_label !== null ? err.actual_label : "-"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flag / Correction Modal Popup */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 rounded-3xl border border-white/10 max-w-sm w-full relative animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-semibold tracking-wider text-white uppercase mb-4 flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              <span>Correct CNN Prediction</span>
            </h4>

            <div className="h-28 w-28 mx-auto rounded-xl bg-black border border-white/10 flex items-center justify-center p-2 mb-6">
              <img
                src={selectedError.image_data}
                alt="Incorrect digit"
                className="max-h-full max-w-full object-contain rounded"
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4 text-center">
              The {selectedError.model_type.toUpperCase()} model predicted a <strong className="text-rose-400">{selectedError.predicted_label}</strong>. What was the actual handwritten digit?
            </p>

            {/* Select corrected value */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCorrectValue(i)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                    correctValue === i
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-950/60 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 w-full">
              <button
                onClick={() => setSelectedError(null)}
                className="flex-1 py-2 text-xs text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCorrectLabel}
                disabled={correctValue === null || submitting}
                className="flex-1 py-2 text-xs font-medium text-white btn-cyber rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? "Updating..." : "Save Label"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
