import { motion } from 'framer-motion'
import { Check, CheckCheck, Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { getNotificationIcon, formatRelativeDate, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { NotificationType } from '@/types'
import { format, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns'

function groupNotificationsByDate(notifications: ReturnType<typeof useNotifications>['notifications']) {
  const groups: Record<string, typeof notifications> = {}

  notifications.forEach(n => {
    const date = parseISO(n.createdAt)
    let key: string
    if (isToday(date)) key = 'Today'
    else if (isYesterday(date)) key = 'Yesterday'
    else if (isThisWeek(date)) key = 'This Week'
    else key = format(date, 'MMMM yyyy')

    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })

  return groups
}

function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case NotificationType.APPLICATION_STATUS: return 'primary'
    case NotificationType.DEADLINE_REMINDER: return 'warning'
    case NotificationType.NEW_MATCH: return 'cyan'
    case NotificationType.DOCUMENT_VERIFIED: return 'success'
    default: return 'default'
  }
}

export default function Notifications() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllRead } = useNotifications()

  if (isLoading) return <PageSpinner />

  const groups = groupNotificationsByDate(notifications)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          description="You'll receive notifications about applications, deadlines, and new AI matches here."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {date}
              </h3>
              <div className="card-glass overflow-hidden">
                {items.map((notification, i) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`
                      flex items-start gap-4 p-4 border-b border-slate-800/50 last:border-0
                      cursor-pointer hover:bg-slate-800/30 transition-colors
                      ${!notification.read ? 'bg-indigo-500/5 hover:bg-indigo-500/8' : ''}
                    `}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Icon */}
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl
                      ${!notification.read ? 'bg-indigo-500/20' : 'bg-slate-800/60'}
                    `}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium ${notification.read ? 'text-slate-400' : 'text-slate-100'}`}>
                            {notification.title}
                          </p>
                          <Badge variant={getNotificationBadge(notification.type) as 'primary' | 'warning' | 'cyan' | 'success' | 'default'}>
                            {notification.type.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-600 mt-1.5">{formatRelativeDate(notification.createdAt)}</p>
                    </div>

                    {/* Mark read button */}
                    {!notification.read && (
                      <button
                        onClick={e => { e.stopPropagation(); markAsRead(notification.id) }}
                        className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
