/**
 * Cross-tab & Server notification broadcaster helper
 */

export interface BroadcastNotificationPayload {
  id?: string;
  type: "membership" | "submission" | "registration" | "system";
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

const CHANNEL_NAME = "bmes_admin_notifications_v1";

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn("BroadcastChannel not supported in this environment:", e);
  }
}

/**
 * Notifies all admins in real-time about a new event/form submission
 */
export async function notifyAdmins(payload: BroadcastNotificationPayload) {
  const notif = {
    ...payload,
    id: payload.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  // 1. Cross-tab BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: "ADMIN_NOTIFICATION", data: notif });
    } catch {
      // ignore
    }
  }

  // 2. In-window custom event dispatch
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bmes:admin-notification", {
        detail: notif,
      })
    );
  }

  // 3. Backend WebSocket Hub broadcast
  try {
    fetch("/api/notifications/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notif),
    }).catch(() => {
      // ignore in offline/isolated preview
    });
  } catch {
    // ignore
  }

  return notif;
}

export function getAdminBroadcastChannel(): BroadcastChannel | null {
  return broadcastChannel;
}
