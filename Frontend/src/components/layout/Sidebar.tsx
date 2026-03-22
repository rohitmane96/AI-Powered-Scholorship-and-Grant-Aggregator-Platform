import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  FileText,
  FolderOpen,
  Bell,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Building2,
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import { getInitials, cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  badge?: number
  aiBadge?: boolean
}

function StudentNav(unreadCount: number): NavItem[] {
  return [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/scholarships', label: 'Scholarships', icon: <GraduationCap className="w-5 h-5" /> },
    { to: '/recommendations', label: 'AI Matches', icon: <Sparkles className="w-5 h-5" />, aiBadge: true },
    { to: '/applications', label: 'Applications', icon: <FileText className="w-5 h-5" /> },
    { to: '/documents', label: 'Documents', icon: <FolderOpen className="w-5 h-5" /> },
    { to: '/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
  ]
}

function InstitutionNav(): NavItem[] {
  return [
    { to: '/institution/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/institution/scholarships', label: 'My Scholarships', icon: <BookOpen className="w-5 h-5" /> },
    { to: '/institution/applications', label: 'Applications', icon: <ClipboardList className="w-5 h-5" /> },
  ]
}

function AdminNav(): NavItem[] {
  return [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <ShieldCheck className="w-5 h-5" /> },
    { to: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { to: '/admin/scholarships', label: 'Scholarships', icon: <GraduationCap className="w-5 h-5" /> },
    { to: '/admin/applications', label: 'Applications', icon: <ClipboardList className="w-5 h-5" /> },
  ]
}

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation()
  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')

  return (
    <NavLink to={item.to} className="block">
      <motion.div
        whileHover={{ x: collapsed ? 0 : 2 }}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
          isActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
        )}
      >
        <div className="shrink-0">{item.icon}</div>
        {!collapsed && (
          <span className="text-sm font-medium flex-1">{item.label}</span>
        )}
        {!collapsed && item.aiBadge && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            AI
          </span>
        )}
        {!collapsed && item.badge !== undefined && item.badge > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold px-1 rounded-full bg-rose-500 text-white">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        {collapsed && item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-xs font-bold rounded-full bg-rose-500 text-white">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </motion.div>
    </NavLink>
  )
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user } = useAuthStore()
  const logout = useLogout()
  const { unreadCount } = useNotifications()

  const navItems = user?.role === UserRole.INSTITUTION
    ? InstitutionNav()
    : user?.role === UserRole.ADMIN
    ? AdminNav()
    : StudentNav(unreadCount)


  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-800', collapsed && 'justify-center px-0')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shrink-0">
          🎓
        </div>
        {!collapsed && (
          <div>
            <span className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ScholarAI
            </span>
            <div className="text-xs text-slate-500 -mt-0.5">AI-Powered Platform</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(item => (
          <NavItemLink key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-slate-800 mx-3" />

      {/* Bottom nav */}
      <div className="p-3 space-y-1">
        <NavItemLink
          item={{ to: '/profile', label: 'Profile & Settings', icon: <Settings className="w-5 h-5" /> }}
          collapsed={collapsed}
        />
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>

      {/* User card */}
      {!collapsed && user && (
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(user.firstName, user.lastName)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle (desktop) */}
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center w-full py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors border-t border-slate-800"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col bg-slate-950 border-r border-slate-800 h-screen sticky top-0 shrink-0 overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 z-50 flex flex-col lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
