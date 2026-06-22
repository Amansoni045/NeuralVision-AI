"use client";

import { useState } from "react";
import { Info, HelpCircle, Eye } from "lucide-react";

interface XAIModuleProps {
  predictionData: any;
}

export default function XAIModule({ predictionData }: XAIModuleProps) {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  if (!predictionData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/5 rounded-2xl glass h-96">
        <Eye className="h-10 w-10 text-slate-600 mb-3" />
        <p className="text-slate-400 text-sm max-w-sm">
          Draw a digit or upload an image in the Sandbox to inspect the CNN's decision-making process.
        </p>
      </div>
    );
  }

  const { gradcam_image, activation_maps } = predictionData;

  const layerNames = activation_maps ? Object.keys(activation_maps) : [];
  if (layerNames.length > 0 && activeLayer === null) {
    setActiveLayer(layerNames[0]);
  }

  const currentActivations = activeLayer && activation_maps ? activation_maps[activeLayer] : null;

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Upper Grid: Grad-CAM explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Card 1: What is Grad-CAM */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase mb-4 flex items-center space-x-2">
              <Info className="h-5 w-5 text-cyan-400" />
              <span>Explainable AI (Grad-CAM)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              <strong>Gradient-weighted Class Activation Mapping (Grad-CAM)</strong> is a computer vision explainability technique. It uses the gradients of the final prediction class, flowing into the final convolutional layer of the CNN, to produce a coarse localization map highlighting the regions in the image most important for predicting the class.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="text-rose-400 font-bold">Red regions</span> show positive influence where the model paid the most attention (e.g. loops, endpoints). <span className="text-blue-500 font-bold">Blue regions</span> show areas that had negligible or neutral influence on the classification.
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-6 p-3 bg-cyan-950/15 border border-cyan-800/10 rounded-xl text-cyan-400 text-[10px]">
            <HelpCircle className="h-4 w-4 flex-shrink-0" />
            <span>This visually justifies if the CNN recognized a &apos;7&apos; by its top horizontal bar vs. a vertical stroke.</span>
          </div>
        </div>

        {/* Card 2: Visual Comparison */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
          <div className="flex space-x-12 items-center justify-center">
            <div className="text-center">
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-3">Model Input</span>
              <div className="h-32 w-32 rounded-xl bg-black border border-white/10 flex items-center justify-center p-2">
                {/* Fallback to standard white box or custom canvas base64 image if available */}
                <div className="h-full w-full rounded bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={predictionData.image_data || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="text-slate-600 font-bold text-xl">→</div>

            <div className="text-center">
              <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase block mb-3">Grad-CAM Overlay</span>
              <div className="h-32 w-32 rounded-xl bg-black border border-cyan-500/20 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                {gradcam_image ? (
                  <img
                    src={gradcam_image}
                    alt="Gradcam overlay"
                    className="h-full w-full object-contain rounded"
                  />
                ) : (
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Not Generated</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intermediate activations */}
      {activation_maps && layerNames.length > 0 && (
        <div className="glass p-6 rounded-2xl border border-white/5 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center space-x-2">
                <Eye className="h-5 w-5 text-cyan-400" />
                <span>Convolutional Activation Explorer</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Click on a layer to inspect individual filter activations</p>
            </div>
            
            {/* Layer tabs */}
            <div className="flex space-x-2 bg-slate-950/80 border border-white/5 p-1 rounded-xl w-full md:w-auto">
              {layerNames.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setActiveLayer(name);
                    setSelectedFilter(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    activeLayer === name
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of filters */}
          {currentActivations && (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left pane: All filters list */}
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase block mb-3">
                  Filters Activated ({currentActivations.num_filters} filters)
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto p-1.5 bg-slate-950/40 rounded-xl border border-white/5">
                  {currentActivations.filters.map((filterB64: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFilter(filterB64)}
                      className={`aspect-square p-1 rounded-lg border bg-black hover:border-cyan-400/50 hover:shadow-[0_0_8px_rgba(6,182,212,0.1)] transition-all overflow-hidden cursor-pointer ${
                        selectedFilter === filterB64 ? "border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "border-white/5"
                      }`}
                    >
                      <img
                        src={filterB64}
                        alt={`Filter ${idx}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right pane: Selected filter enlargement */}
              <div className="w-full lg:w-64 glass p-4 rounded-xl border border-white/5 flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase block mb-4">Filter Inspector</span>
                {selectedFilter ? (
                  <div className="flex flex-col items-center">
                    <div className="h-40 w-40 rounded-lg bg-black border border-cyan-500/20 p-2 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                      <img
                        src={selectedFilter}
                        alt="Selected Filter Map"
                        className="h-full w-full object-contain rounded"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed mt-4">
                      This filter highlights specific spatial features (edges, diagonals, orientations, or loop contours) captured by this CNN kernel.
                    </p>
                  </div>
                ) : (
                  <div className="h-40 w-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-lg text-slate-600 text-center px-4">
                    <Eye className="h-8 w-8 mb-2" />
                    <span className="text-[10px] uppercase font-mono tracking-wider">Select a filter</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
