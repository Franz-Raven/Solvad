import { Client, type StompSubscription } from '@stomp/stompjs';
import type { Notification } from '@/types/notification';

// Fallback to localhost if env var is missing
const RAW_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

// Helper to use ws:// for localhost and wss:// for production
function getBrokerURL(): string {
  let url = RAW_WS_URL;
  if (url.startsWith('https://')) url = url.replace('https://', 'wss://');
  else if (url.startsWith('http://')) url = url.replace('http://', 'ws://');
  return url;
}

const NOTIFICATIONS_DESTINATION = '/user/queue/notifications';

type NotificationHandler = (notification: Notification) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private handler: NotificationHandler | null = null;
  private onReconnect: (() => void) | null = null;
  private connectCount = 0;

  connect(token: string): Promise<void> {
    if (this.client?.active) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const client = new Client({
        brokerURL: getBrokerURL(), 
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          if (this.client !== client) return;
          this.connectCount += 1;
          this.attachSubscription();
          if (this.connectCount > 1) this.onReconnect?.();
          resolve();
        },
        onStompError: (frame) => {
          reject(new Error(frame.headers['message'] ?? 'WebSocket authentication failed'));
          if (this.connectCount === 0) {
            void client.deactivate();
            if (this.client === client) this.client = null;
          }
        },
      });

      this.client = client;
      client.activate();
    });
  }

  subscribeToNotifications(
    onNotification: NotificationHandler,
    onReconnect?: () => void,
  ): () => void {
    this.handler = onNotification;
    this.onReconnect = onReconnect ?? null;
    this.attachSubscription();

    return () => {
      this.dropSubscription();
      this.handler = null;
      this.onReconnect = null;
    };
  }

  disconnect(): void {
    this.dropSubscription();
    this.handler = null;
    this.onReconnect = null;
    this.connectCount = 0;
    const client = this.client;
    this.client = null;
    if (client) void client.deactivate();
  }

  private attachSubscription(): void {
    if (!this.client?.connected || !this.handler) return;
    this.dropSubscription();

    const handler = this.handler;
    this.subscription = this.client.subscribe(NOTIFICATIONS_DESTINATION, (frame) => {
      try {
        handler(JSON.parse(frame.body) as Notification);
      } catch (err) {
        console.error('Failed to parse notification frame', err);
      }
    });
  }

  private dropSubscription(): void {
    try {
      this.subscription?.unsubscribe();
    } catch {
      // The socket may already be closed after a drop; nothing to clean up.
    }
    this.subscription = null;
  }
}

export const webSocketService = new WebSocketService();