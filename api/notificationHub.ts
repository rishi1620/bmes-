import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";

export interface RealtimeNotification {
  id: string;
  type: "membership" | "submission" | "registration" | "system";
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  isRead?: boolean;
}

class NotificationHub {
  private wss: WebSocketServer | null = null;
  private recentNotifications: RealtimeNotification[] = [];
  private readonly MAX_HISTORY = 50;

  public init(server: Server) {
    if (this.wss) return;

    this.wss = new WebSocketServer({
      noServer: true,
    });

    server.on("upgrade", (request, socket, head) => {
      try {
        const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
        if (url.pathname === "/ws/notifications") {
          this.wss?.handleUpgrade(request, socket, head, (ws) => {
            this.wss?.emit("connection", ws, request);
          });
        }
      } catch {
        // ignore errors and do not abort socket for other listeners
      }
    });

    this.wss.on("connection", (ws: WebSocket) => {
      // Send initial connection ACK and recent notifications
      const initPayload = {
        type: "INIT",
        history: this.recentNotifications,
        timestamp: new Date().toISOString(),
      };
      try {
        ws.send(JSON.stringify(initPayload));
      } catch (err) {
        console.error("Error sending initial notifications to client:", err);
      }

      ws.on("message", (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "PING") {
            ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
          } else if (data.type === "BROADCAST") {
            if (data.notification) {
              this.broadcast(data.notification);
            }
          }
        } catch {
          // ignore malformed client messages
        }
      });

      ws.on("error", (err) => {
        console.warn("WebSocket client connection error:", err.message);
      });
    });

    // Heartbeat ping interval to keep connections active
    setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.ping();
          } catch {
            // ignore
          }
        }
      });
    }, 30000);

    console.log("⚡ [NotificationHub] WebSocket notification server initialized on /ws/notifications");
  }

  public broadcast(notification: Omit<RealtimeNotification, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
    const fullNotification: RealtimeNotification = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      metadata: notification.metadata || {},
      createdAt: notification.createdAt || new Date().toISOString(),
      isRead: false,
    };

    // Store in in-memory history (prevent duplicate by ID)
    const existingIndex = this.recentNotifications.findIndex((n) => n.id === fullNotification.id);
    if (existingIndex >= 0) {
      this.recentNotifications[existingIndex] = fullNotification;
    } else {
      this.recentNotifications.unshift(fullNotification);
      if (this.recentNotifications.length > this.MAX_HISTORY) {
        this.recentNotifications.pop();
      }
    }

    if (!this.wss) return fullNotification;

    const payload = JSON.stringify({
      type: "NOTIFICATION",
      data: fullNotification,
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err) {
          console.error("Failed to broadcast notification to client:", err);
        }
      }
    });

    return fullNotification;
  }

  public getRecent(): RealtimeNotification[] {
    return [...this.recentNotifications];
  }
}

export const notificationHub = new NotificationHub();
