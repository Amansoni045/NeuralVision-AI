"use client";

import Link from "next/link";
import { 
  Activity, 
  Brain, 
  Camera, 
  Cpu, 
  Eye, 
  Database, 
  BarChart4, 
  Play,
  Sparkles
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ThreeBackground from "@/components/ThreeBackground";

export default function Home() {
  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* 3D Animated Background */}
      <ThreeBackground />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-grid pointer-events-none z-0" />

      {/* Navbar Header */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-28 pb-16 px-4 z-10 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-6 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-cyan-400 font-mono tracking-wide">
            <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span>Interactive deep learning & explainability platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">
            Transforming CNNs into{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
              Production AI
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            NeuralVision AI is an end-to-end digit recognition workspace. Compare Perceptron, ANN, and CNN models in real-time, inspect activations, and audit predictions with explainable Grad-CAM.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              href="/dashboard?demo=true"
              className="px-8 py-3.5 text-sm font-semibold tracking-wide btn-cyber rounded-xl shadow-lg w-full sm:w-auto text-center flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Try Sandbox Demo</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3.5 text-sm font-semibold tracking-wide border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl hover:bg-slate-900/50 transition-all w-full sm:w-auto text-center cursor-pointer"
            >
              Launch Workspace
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <section id="features" className="w-full pt-28">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold tracking-widest text-cyan-400 uppercase font-mono mb-2">Workspace Modules</h2>
            <p className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">SaaS-Grade MLOps Ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-cyan-500/5 rounded-bl-full filter blur-lg transition-all group-hover:bg-cyan-500/10" />
              <Brain className="h-8 w-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Interactive Drawing Canvas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sketch digits on our high-performance viewport. Predictions update instantly in real-time as you draw, detailing confidence intervals across all 10 classes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/5 rounded-bl-full filter blur-lg transition-all group-hover:bg-violet-500/10" />
              <Camera className="h-8 w-8 text-violet-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Webcam Recognition</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stream live webcam feeds to classify handwritten digits in real-time. Features automated pre-processing overlays to crop, resize, and normalize frames.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-rose-500/5 rounded-bl-full filter blur-lg transition-all group-hover:bg-rose-500/10" />
              <Cpu className="h-8 w-8 text-rose-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Model Battle Arena</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run feedforward inferences through Perceptron, ANN, and CNN networks in parallel. Benchmark execution latencies, accuracy scores, and parameter metrics.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full filter blur-lg transition-all group-hover:bg-amber-500/10" />
              <Eye className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Explainable AI (Grad-CAM)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Audit CNN predictions. Visually explore heatmaps showing which pixels triggered classifications and interactively examine activation maps for each layer.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full filter blur-lg transition-all group-hover:bg-emerald-500/10" />
              <Database className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Relational Logging</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects to a PostgreSQL database to store historical classifications. Flag incorrect model outputs and explore class distributions in the error hub.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full filter blur-lg transition-all group-hover:bg-blue-500/10" />
              <BarChart4 className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">MLflow & MLOps Pipelines</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track training epochs, validation curves, loss, accuracy, and register model versions with MLflow logs. Run builds reliably in Docker containers.
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack section */}
        <section id="tech-stack" className="w-full pt-28">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold tracking-widest text-cyan-400 uppercase font-mono mb-2">Tech Stack</h2>
            <p className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">The Modern AI Stack</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="glass px-6 py-4 rounded-xl border border-white/5 text-center">
              <span className="text-sm font-bold text-white block">Next.js 15</span>
              <span className="text-[10px] text-slate-500 font-mono">React Framework</span>
            </div>
            <div className="glass px-6 py-4 rounded-xl border border-white/5 text-center">
              <span className="text-sm font-bold text-white block">FastAPI</span>
              <span className="text-[10px] text-slate-500 font-mono">Python REST API</span>
            </div>
            <div className="glass px-6 py-4 rounded-xl border border-white/5 text-center">
              <span className="text-sm font-bold text-white block">TensorFlow</span>
              <span className="text-[10px] text-slate-500 font-mono">Deep Learning Engine</span>
            </div>
            <div className="glass px-6 py-4 rounded-xl border border-white/5 text-center">
              <span className="text-sm font-bold text-white block">PostgreSQL</span>
              <span className="text-[10px] text-slate-500 font-mono">Relational DB</span>
            </div>
            <div className="glass px-6 py-4 rounded-xl border border-white/5 text-center">
              <span className="text-sm font-bold text-white block">TailwindCSS</span>
              <span className="text-[10px] text-slate-500 font-mono">Styling Engine</span>
            </div>
            <div className="glass px-6 py-4 rounded-xl border border-white/5 text-center">
              <span className="text-sm font-bold text-white block">Three.js</span>
              <span className="text-[10px] text-slate-500 font-mono">3D Graphics R3F</span>
            </div>
            <div className="glass px-6 py-4 rounded-xl border border-white/5 text-center">
              <span className="text-sm font-bold text-white block">MLflow</span>
              <span className="text-[10px] text-slate-500 font-mono">Experiment Tracking</span>
            </div>
            <div className="glass px-6 py-4 rounded-xl border border-white/5 text-center">
              <span className="text-sm font-bold text-white block">Docker</span>
              <span className="text-[10px] text-slate-500 font-mono">Containerization</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full z-10 glass border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>&copy; 2026 NeuralVision AI. Built for scalable MLOps, deep learning, and advanced computer vision analytics.</p>
      </footer>
    </div>
  );
}
