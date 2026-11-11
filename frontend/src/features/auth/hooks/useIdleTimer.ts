"use client";

import { useEffect, useRef, useCallback } from "react";

const DEFAULT_IDLE_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours (180 minutes)
const LEGACY_ACTIVITY_KEY = "hrflow_last_activity_timestamp";
const IDLE_BROADCAST_CHANNEL = "hrflow_idle_activity_channel";
const THROTTLE_INTERVAL_MS = 10_000; // Throttle activity updates to once per 10s

interface UseIdleTimerOptions {
  timeoutMs?: number;
  onIdle: () => void;
  enabled?: boolean;
}

/**
 * Hook tracking user inactivity purely in RAM across tabs (using BroadcastChannel, zero localStorage).
 * If no interaction occurs for 3 hours, triggers onIdle callback to enforce enterprise session security.
 */
export function useIdleTimer({
  timeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  onIdle,
  enabled = true,
}: UseIdleTimerOptions): void {
  const lastActiveRef = useRef<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  const updateActivity = useCallback(() => {
    const now = Date.now();
    // Throttle writing to memory and broadcast channel to minimize CPU overhead
    if (now - lastActiveRef.current < THROTTLE_INTERVAL_MS) {
      return;
    }
    lastActiveRef.current = now;
    try {
      channelRef.current?.postMessage(now);
    } catch {
      // Ignore BroadcastChannel errors in restricted contexts
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Clean up any legacy localStorage timestamp key so DevTools Local Storage stays empty
    try {
      window.localStorage.removeItem(LEGACY_ACTIVITY_KEY);
    } catch {
      // Ignore
    }

    lastActiveRef.current = Date.now();

    // Open in-memory BroadcastChannel to synchronize activity across open tabs without localStorage
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel(IDLE_BROADCAST_CHANNEL);
        channel.onmessage = (event: MessageEvent<number>) => {
          const time = Number(event.data);
          if (!Number.isNaN(time) && time > lastActiveRef.current) {
            lastActiveRef.current = time;
          }
        };
        channelRef.current = channel;
      } catch {
        channelRef.current = null;
      }
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleUserInteraction = () => {
      updateActivity();
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleUserInteraction, {
        passive: true,
      });
    });

    // Periodic check every 15 seconds using in-memory timestamp
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      if (now - lastActiveRef.current >= timeoutMs) {
        onIdleRef.current();
      }
    }, 15_000);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserInteraction);
      });
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      window.clearInterval(intervalId);
    };
  }, [enabled, timeoutMs, updateActivity]);
}
