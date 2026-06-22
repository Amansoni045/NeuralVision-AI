"use client";

import Link from "next/link";
import { 
  Activity, 
  Brain, 
  Cpu, 
  Eye, 
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
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-4 z-10 max-w-7xl mx-auto w-full">
        {/* Style injection for animated pipeline connection lines */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes progress-flow {
            0% { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 0; }
          }
          .animate-flow {
            stroke-dasharray: 6, 4;
            animation: progress-flow 1.2s linear infinite;
          }
        `}} />

        <div className="text-center space-y-6 max-w-3xl mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-cyan-400 font-mono tracking-wide">
            <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span>Experience Interactive Deep Learning Explainability</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">
            Draw a Number.{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
              Watch AI Understand It.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            NeuralVision AI is an end-to-end computer vision workspace. Sketch digits, compare model architectures side-by-side, inspect layer filters, and see exactly *why* the AI made its decision in real-time.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              href="/dashboard?demo=true"
              className="px-8 py-3.5 text-sm font-semibold tracking-wide btn-cyber rounded-xl shadow-lg w-full sm:w-auto text-center flex items-center justify-center space-x-2 cursor-pointer transition-transform hover:scale-105"
            >
              <Play className="h-4 w-4 fill-current animate-pulse" />
              <span>Watch AI Think (Interactive Demo)</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3.5 text-sm font-semibold tracking-wide border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl hover:bg-slate-900/50 transition-all w-full sm:w-auto text-center cursor-pointer"
            >
              Launch Workspace
            </Link>
          </div>
        </div>

        {/* Interactive Architecture Visualization Section */}
        <section className="w-full max-w-5xl mb-24">
          <div className="text-center mb-10">
            <h2 className="text-xs font-semibold tracking-widest text-cyan-400 uppercase font-mono mb-2">Interactive Pipeline</h2>
            <p className="text-xl md:text-2xl font-bold text-white">How the AI processes your drawing</p>
          </div>

          <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-4 items-center justify-between">
            <div className="absolute inset-0 bg-cyan-500/[0.01] pointer-events-none" />

            {/* Pipeline Stage 1 */}
            <div className="flex flex-col items-center text-center max-w-[150px] group cursor-default">
              <div className="h-12 w-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all">
                <Brain className="h-5 w-5 text-cyan-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-3">1. User Drawing</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                You draw a digit on the viewport or stream it via webcam.
              </p>
            </div>

            {/* Connecting Arrow 1 */}
            <div className="hidden md:block flex-1 min-w-[20px] max-w-[80px]">
              <svg className="w-full h-2" fill="none">
                <path d="M 0,4 L 80,4" stroke="#06b6d4" strokeWidth="2" className="animate-flow" />
              </svg>
            </div>
            <div className="md:hidden h-8 w-2 flex items-center justify-center">
              <svg className="w-2 h-full" fill="none">
                <path d="M 1,0 L 1,32" stroke="#06b6d4" strokeWidth="2" className="animate-flow" />
              </svg>
            </div>

            {/* Pipeline Stage 2 */}
            <div className="flex flex-col items-center text-center max-w-[150px] group cursor-default">
              <div className="h-12 w-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-violet-400 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all">
                <Activity className="h-5 w-5 text-violet-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-3">2. Preprocessing</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                Image is scaled to 28x28, centered, and normalized.
              </p>
            </div>

            {/* Connecting Arrow 2 */}
            <div className="hidden md:block flex-1 min-w-[20px] max-w-[80px]">
              <svg className="w-full h-2" fill="none">
                <path d="M 0,4 L 80,4" stroke="#8b5cf6" strokeWidth="2" className="animate-flow" />
              </svg>
            </div>
            <div className="md:hidden h-8 w-2 flex items-center justify-center">
              <svg className="w-2 h-full" fill="none">
                <path d="M 1,0 L 1,32" stroke="#8b5cf6" strokeWidth="2" className="animate-flow" />
              </svg>
            </div>

            {/* Pipeline Stage 3 */}
            <div className="flex flex-col items-center text-center max-w-[150px] group cursor-default">
              <div className="h-12 w-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-rose-400 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all">
                <Cpu className="h-5 w-5 text-rose-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-3">3. Convolutional NN</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                Convolutional filters scan shapes and check features.
              </p>
            </div>

            {/* Connecting Arrow 3 */}
            <div className="hidden md:block flex-1 min-w-[20px] max-w-[80px]">
              <svg className="w-full h-2" fill="none">
                <path d="M 0,4 L 80,4" stroke="#f43f5e" strokeWidth="2" className="animate-flow" />
              </svg>
            </div>
            <div className="md:hidden h-8 w-2 flex items-center justify-center">
              <svg className="w-2 h-full" fill="none">
                <path d="M 1,0 L 1,32" stroke="#f43f5e" strokeWidth="2" className="animate-flow" />
              </svg>
            </div>

            {/* Pipeline Stage 4 */}
            <div className="flex flex-col items-center text-center max-w-[150px] group cursor-default">
              <div className="h-12 w-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-amber-400 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all">
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-3">4. Predict Output</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                Model calculates the confidence across all 10 digits.
              </p>
            </div>

            {/* Connecting Arrow 4 */}
            <div className="hidden md:block flex-1 min-w-[20px] max-w-[80px]">
              <svg className="w-full h-2" fill="none">
                <path d="M 0,4 L 80,4" stroke="#f59e0b" strokeWidth="2" className="animate-flow" />
              </svg>
            </div>
            <div className="md:hidden h-8 w-2 flex items-center justify-center">
              <svg className="w-2 h-full" fill="none">
                <path d="M 1,0 L 1,32" stroke="#f59e0b" strokeWidth="2" className="animate-flow" />
              </svg>
            </div>

            {/* Pipeline Stage 5 */}
            <div className="flex flex-col items-center text-center max-w-[150px] group cursor-default">
              <div className="h-12 w-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all">
                <Eye className="h-5 w-5 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-3">5. Explain Audits</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                Grad-CAM traces gradients to show *why* it decided.
              </p>
            </div>
          </div>
        </section>

        {/* Guided User Journey (4 Steps) */}
        <section id="journey" className="w-full mb-24">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold tracking-widest text-cyan-400 uppercase font-mono mb-2">How It Works</h2>
            <p className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Your Guided User Journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass p-5 rounded-2xl border border-white/5 relative">
              <div className="absolute top-4 right-4 text-3xl font-black text-white/5 font-mono select-none">01</div>
              <span className="text-[9px] uppercase font-mono tracking-wider text-cyan-400 font-bold block mb-1">Step 1</span>
              <h3 className="text-sm font-bold text-white mb-2">Input / Draw</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sketch a digit on the canvas panel or activate the live HD webcam feed to show a digit card to the AI.
              </p>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 relative">
              <div className="absolute top-4 right-4 text-3xl font-black text-white/5 font-mono select-none">02</div>
              <span className="text-[9px] uppercase font-mono tracking-wider text-violet-400 font-bold block mb-1">Step 2</span>
              <h3 className="text-sm font-bold text-white mb-2">Predict</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Compare models side-by-side in the Model Battle Arena to benchmark predictions, latencies, and parameters.
              </p>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 relative">
              <div className="absolute top-4 right-4 text-3xl font-black text-white/5 font-mono select-none">03</div>
              <span className="text-[9px] uppercase font-mono tracking-wider text-rose-400 font-bold block mb-1">Step 3</span>
              <h3 className="text-sm font-bold text-white mb-2">Understand</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Look behind the curtain using Grad-CAM heatmaps and explore activation explorer filters layer by layer.
              </p>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 relative">
              <div className="absolute top-4 right-4 text-3xl font-black text-white/5 font-mono select-none">04</div>
              <span className="text-[9px] uppercase font-mono tracking-wider text-amber-400 font-bold block mb-1">Step 4</span>
              <h3 className="text-sm font-bold text-white mb-2">Explore MLOps</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Log predictions in the PostgreSQL database, explore real-world errors in the hub, and check MLflow tracking curves.
              </p>
            </div>
          </div>
        </section>

        {/* Can You Fool The AI? (Model Limitations) */}
        <section id="fool-ai" className="w-full mb-24 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold tracking-widest text-rose-400 uppercase font-mono mb-2">Honest Machine Learning</h2>
            <p className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Can you fool the AI?</p>
            <p className="text-xs text-slate-400 mt-2 max-w-lg mx-auto">
              Real neural networks aren&apos;t perfect. Try sketching these edge cases inside the workspace to see where AI struggles and how explainability audits reveal its logic:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-2xl border border-white/5">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold font-mono text-sm mb-3">7</div>
              <h3 className="text-xs font-bold text-white mb-2">The Crossed European &apos;7&apos;</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                US MNIST models are rarely trained on handwritten 7s containing a middle horizontal strike-through. Sketch one to watch the AI confuse it with a 2 or a 3.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/5">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold font-mono text-sm mb-3">4</div>
              <h3 className="text-xs font-bold text-white mb-2">The Loop Closed &apos;4&apos; vs &apos;9&apos;</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                If you close the upper triangle of your written 4, the model loses the vertical stroke feature and will misclassify it as a 9 with very high confidence.
              </p>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/5">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold font-mono text-sm mb-3">8</div>
              <h3 className="text-xs font-bold text-white mb-2">The Open Loop &apos;8&apos; vs &apos;3&apos;</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                If the left loops of your written 8 don&apos;t connect perfectly, the CNN misses the closed circle geometry and classifies it as a 3, demonstrating its focus on closed loops.
              </p>
            </div>
          </div>
        </section>

        {/* Recruiter Corner: What This Project Demonstrates */}
        <section id="recruiter-corner" className="w-full pt-12 border-t border-white/5">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold tracking-widest text-cyan-400 uppercase font-mono mb-2">Recruiter Corner</h2>
            <p className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">What This Project Demonstrates</p>
            <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto">
              Built to show production-grade software engineering, database integration, and MLOps practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Skills Card 1 */}
            <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Deep Learning & Explainability</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  Demonstrates architecture design of Convolutional Neural Networks (CNNs) in TensorFlow/Keras. Focuses on gradient-weighted class activation mapping (Grad-CAM) to inspect intermediate node layers and visual prediction rationale.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">CNNs</span>
                <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">Grad-CAM</span>
                <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">TensorFlow</span>
              </div>
            </div>

            {/* Skills Card 2 */}
            <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-violet-400" />
                  <span>Production-Grade MLOps</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  Integrates experiment logging pipelines with MLflow. Implements relational schema logging for database storage, model versioning, automatic training fallbacks, and multi-container coordination.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                <span className="text-[9px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded">MLflow</span>
                <span className="text-[9px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded">PostgreSQL</span>
                <span className="text-[9px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded">Docker Compose</span>
              </div>
            </div>

            {/* Skills Card 3 */}
            <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span>Full-Stack Web Engineering</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  Features a modern, high-performance Next.js 15 app router clientside UI and a fast, asynchronous FastAPI REST server. Leverages low-latency base64 transmission pipelines, canvas rendering, and reactive stream triggers.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded">Next.js 15</span>
                <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded">FastAPI</span>
                <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded">TailwindCSS</span>
              </div>
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
