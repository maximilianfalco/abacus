"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: "session_complete" | "sync_received" | string;
  data?: unknown;
}

export interface UseWebSocketParams {
  url?: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connectionState: "connecting" | "connected" | "disconnected" | "error";
}

export function useWebSocket(params?: UseWebSocketParams): UseWebSocketReturn {
  const {
    url,
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = params ?? {};

  const [connectionState, setConnectionState] = useState("disconnected" as UseWebSocketReturn["connectionState"]);
  const [lastMessage, setLastMessage] = useState(null as WebSocketMessage | null);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    const wsUrl = url ?? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws`;

    setConnectionState("connecting");

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState("connected");
      attemptsRef.current = 0;
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 30_000);
    };

    ws.onmessage = (event) => {
      if (event.data === "pong") return;
      try {
        const msg = JSON.parse(event.data as string) as WebSocketMessage;
        setLastMessage(msg);
      } catch {
        // non-JSON message, ignore
      }
    };

    ws.onclose = () => {
      setConnectionState("disconnected");
      clearInterval(heartbeatRef.current);
      if (enabled && attemptsRef.current < maxReconnectAttempts) {
        const delay = reconnectInterval * Math.pow(2, Math.min(attemptsRef.current, 5));
        attemptsRef.current++;
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      setConnectionState("error");
      ws.close();
    };
  }, [url, enabled, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    connect();
    return () => {
      clearInterval(heartbeatRef.current);
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    isConnected: connectionState === "connected",
    lastMessage,
    connectionState,
  };
}
