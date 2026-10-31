import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Notification } from '@/types/notification';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
const NOTIFICATIONS_DESTINATION = '/user/queue/notifications';

type NotificationHandler = (notification: Notification) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private handler: NotificationHandler | null = null;
  private onReconnect: (() => void) | null = null;
  private connectCount = 0;

  // One connection per app session. Safe to call repeatedly.
  connect(token: string): Promise<void> {
    if (!WS_URL) {
      return Promise.reject(new Error('NEXT_PUBLIC_WS_URL is not set'));
    }
    if (this.client?.active) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          if (this.client !== client) return; // stale client (e.g. StrictMode remount)
          this.connectCount += 1;
          this.attachSubscription();
          if (this.connectCount > 1) this.onReconnect?.(); // catch up on anything missed while offline
          resolve();
        },
        onStompError: (frame) => {
          reject(new Error(frame.headers['message'] ?? 'WebSocket authentication failed'));
          // Never connected = rejected handshake (bad/expired token). Stop the retry loop.
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

  /**
   Register the handler for /user/queue/notifications. Can be called before or
    after connect(); the subscription is (re)attached on every (re)connect. 
    onReconnect fires after each reconnect, not the first connect.
    Returns an unsubscribe function.
   */
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