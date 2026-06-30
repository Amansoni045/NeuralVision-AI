import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackendStatusProvider from "@/components/BackendStatusProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuralVision AI - Interactive Deep Learning Explainability Workspace",
  description: "An end-to-end computer vision platform. Draw digits, compare neural architectures (Perceptron, ANN, CNN) side-by-side, inspect layers, and view Grad-CAM explainability heatmaps in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BackendStatusProvider>
          {children}
        </BackendStatusProvider>
      </body>
    </html>
  );
}
