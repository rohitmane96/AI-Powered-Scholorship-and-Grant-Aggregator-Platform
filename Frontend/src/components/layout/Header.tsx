import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { getInitials, formatRelativeDate, getNotificationIcon } from '@/lib/utils'
import { MobileMenuButton } from './Sidebar'

interface HeaderProps {
  onMobileMenuOpen: () => void
}

function breadcrumbFromPath(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/scholarships': 'Browse Scholarships',
    '/recommendations': 'AI Recommendations',
    '/applications': 'My Applications',
    '/documents': 'Documents',
    '/notifications': 'Notifications',
    '/profile': 'Profile',
    '/institution/dashboard': 'Institution Dashboard',
    '/institution/scholarships': 'Manage Scholarships',
    '/institution/applications': 'Review Applications',
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/users': 'User Management',
    '/admin/scholarships': 'All Scholarships',
    '/admin/applications': 'All Applications',
  }
  const key = Object.keys(map).find(k => pathname.startsWith(k))
  return key ? map[key] : 'ScholarAI'
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const { user } = useAuthStore()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDark, setIsDark] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const title = breadcrumbFromPath(location.pathname)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleTheme() {
    setIsDark(prev => !prev)
    document.documentElement.classList.toggle('dark')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/scholarships?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          <MobileMenuButton onClick={onMobileMenuOpen} />
          <div>
            <h1 className="text-base font-semibold text-slate-100">{title}</h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {user ? `${user.firstName} ${user.lastName}` : 'ScholarAI'}
            </p>
          </div>
        </div>

        {/* Center: Search (expandable) */}
        <div className="flex-1 max-w-md hidden sm:block">
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.form
                key="search-open"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSearch}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search scholarships..."
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="search-closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 w-full bg-slate-800/30 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Search scholarships...</span>
                <kbd className="ml-auto text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 hidden md:inline">
                  ⌘K
                </kbd>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Mobile search */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={() => navigate('/scholarships')}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotificationsOpen(prev => !prev)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-xs font-bold rounded-full bg-rose-500 text-white px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="font-semibold text-slate-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <button
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id)
                            navigate('/notifications')
                            setNotificationsOpen(false)
                          }}
                          className={`w-full flex items-start gap-3 p-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 text-left ${!n.read ? 'bg-indigo-500/5' : ''}`}
                        >
                          <span className="text-lg shrink-0 mt-0.5">{getNotificationIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${n.read ? 'text-slate-400' : 'text-slate-100'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                            <p className="text-xs text-slate-600 mt-1">{formatRelativeDate(n.createdAt)}</p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-800">
                    <button
                      onClick={() => { navigate('/notifications'); setNotificationsOpen(false) }}
                      className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 py-1"
                    >
                      View all notifications →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(prev => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user ? getInitials(user.firstName, user.lastName) : 'U'
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-slate-800">
                    <p className="text-sm font-semibold text-slate-100">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <div className="border-t border-slate-800 my-1" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
