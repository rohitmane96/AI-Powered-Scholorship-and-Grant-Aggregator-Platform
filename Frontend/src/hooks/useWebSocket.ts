import { useEffect, useRef } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/store/authStore'
import { Notification } from '@/types'

interface UseWebSocketOptions {
  onNotification: (notification: Notification) => void
}

export function useWebSocket({ onNotification }: UseWebSocketOptions) {
  const stompClientRef = useRef<Client | null>(null)
  const token = useAuthStore(state => state.token)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || !token) return

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body) as Notification
            onNotification(notification)
          } catch {
            // Ignore parse errors
          }
        })
      },
      onDisconnect: () => {
        // Connection closed
      },
      onStompError: () => {
        // STOMP error, will auto-reconnect
      },
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
      stompClientRef.current = null
    }
  }, [isAuthenticated, token, onNotification])

  return stompClientRef.current
}
