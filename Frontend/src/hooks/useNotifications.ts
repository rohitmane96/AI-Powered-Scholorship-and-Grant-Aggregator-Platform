import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { notificationsApi } from '@/api/notifications'
import { Notification } from '@/types'
import { useWebSocket } from './useWebSocket'
import { getNotificationIcon } from '@/lib/utils'

export function useNotifications() {
  const queryClient = useQueryClient()
  const [wsNotifications, setWsNotifications] = useState<Notification[]>([])

  const { data: notificationsPage, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(0, 20),
  })

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  })

  const handleWebSocketNotification = useCallback((notification: Notification) => {
    setWsNotifications(prev => [notification, ...prev])
    queryClient.invalidateQueries({ queryKey: ['notifications'] })

    const icon = getNotificationIcon(notification.type)
    toast(notification.title, {
      icon,
      style: {
        background: '#1e293b',
        color: '#f1f5f9',
        border: '1px solid #334155',
      },
    })
  }, [queryClient])

  useWebSocket({ onNotification: handleWebSocketNotification })

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const prev = queryClient.getQueryData(['notifications'])
      queryClient.setQueryData(['notifications'], (old: unknown) => {
        const oldData = old as { content?: Notification[] }
        if (!oldData?.content) return old
        return {
          ...oldData,
          content: oldData.content.map((n: Notification) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }
      })
      return { prev }
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['notifications'], context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      toast.success('All notifications marked as read')
    },
  })

  const allNotifications = [
    ...wsNotifications,
    ...(notificationsPage?.content ?? []),
  ].filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i)

  const unreadCount = (unreadCountData?.count ?? 0) + wsNotifications.filter(n => !n.read).length

  return {
    notifications: allNotifications,
    unreadCount,
    isLoading,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  }
}
