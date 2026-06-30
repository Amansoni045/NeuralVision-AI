"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config";

export type BackendStatus = "checking" | "online" | "sleeping" | "offline";

interface BackendStatusContextType {
  status: BackendStatus;
  elapsedSeconds: number;
  checkStatus: (forceChecking?: boolean) => Promise<void>;
}

const BackendStatusContext = createContext<BackendStatusContextType>({
  status: "checking",
  elapsedSeconds: 0,
  checkStatus: async () => {},
});

export const useBackend = () => useContext(BackendStatusContext);

export default function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const checkStatus = useCallback(async (forceChecking = false) => {
    if (forceChecking) {
      setStatus("checking");
    }
    const controller = new AbortController();
    // Use a 60s timeout for the overall fetch to allow cold-starts to resolve
    const timeoutId = setTimeout(() => controller.abort(), 60000); 

    // Detect if server is sleeping (taking > 1.5 seconds to reply)
    const slowTimer = setTimeout(() => {
      setStatus("sleeping");
    }, 1500);

    try {
      const res = await fetch(`${API_BASE_URL}/`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(slowTimer);
      clearTimeout(timeoutId);

      if (res.ok) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch (err) {
      clearTimeout(slowTimer);
      clearTimeout(timeoutId);
      console.warn("Backend health check failed:", err);
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    checkStatus();

    // Determine polling frequency dynamically based on connection status:
    // - checking/sleeping: poll fast (4s) to detect immediately when it wakes up.
    // - offline: poll medium (10s) to see when it comes back up.
    // - online: poll slow (30s) just to monitor health.
    let intervalTime = 30000;
    if (status === "sleeping" || status === "checking") {
      intervalTime = 4000;
    } else if (status === "offline") {
      intervalTime = 10000;
    }

    const interval = setInterval(() => {
      checkStatus();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [status, checkStatus]);

  // Handle elapsed seconds counter when in "sleeping" state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "sleeping") {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [status]);

  return (
    <BackendStatusContext.Provider value={{ status, elapsedSeconds, checkStatus }}>
      {children}
    </BackendStatusContext.Provider>
  );
}
