import { useState, useEffect, useCallback } from "react";

const QUEUE_KEY = "offline_reports_queue";
const BACKEND = "http://localhost:8080";

/** Read the current queue from localStorage */
function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Write array back to localStorage */
function writeQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * useOfflineQueue
 *
 * Returns:
 *  isOnline       — current connectivity flag
 *  pendingCount   — number of reports waiting to sync
 *  saveToQueue    — fn(report, token) → saves report locally when offline
 *  syncNow        — fn(token) → manually trigger sync
 */
export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(() => readQueue().length);

  // Keep isOnline in sync with browser events
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /** Sync one report; returns true on success */
  const uploadReport = useCallback(async (report, token) => {
    const res = await fetch(`${BACKEND}/api/issues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(report),
    });
    return res.ok;
  }, []);

  /** Attempt to sync all queued reports */
  const syncNow = useCallback(
    async (token) => {
      const queue = readQueue();
      if (!queue.length) return;

      const remaining = [];
      for (const item of queue) {
        try {
          const ok = await uploadReport(item.report, token || item.token);
          if (!ok) remaining.push(item);
        } catch {
          remaining.push(item); // still offline or error → keep in queue
        }
      }
      writeQueue(remaining);
      setPendingCount(remaining.length);
    },
    [uploadReport]
  );

  // Auto-sync whenever we come back online
  useEffect(() => {
    if (!isOnline) return;
    const token = localStorage.getItem("token") || "";
    if (token) syncNow(token);
  }, [isOnline, syncNow]);

  /** Save a report to the local queue (used when offline) */
  const saveToQueue = useCallback((report, token) => {
    const queue = readQueue();
    queue.push({
      id: Date.now(),
      savedAt: new Date().toISOString(),
      token: token || "",
      report,
    });
    writeQueue(queue);
    setPendingCount(queue.length);
  }, []);

  return { isOnline, pendingCount, saveToQueue, syncNow };
}
