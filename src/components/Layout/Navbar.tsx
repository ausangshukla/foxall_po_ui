import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'

export function AppNavbar() {
  const { user, isAuthenticated, logout, canManageUsers } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const linkClass = (path: string) => {
    return isActive(path)
      ? "text-emerald-900 font-extrabold border-b-2 border-emerald-500 pb-1 tracking-tight text-sm transition-all"
      : "text-slate-500 hover:text-emerald-700 transition-colors font-bold tracking-tight text-sm"
  }

  const mobileLinkClass = (path: string) => {
    return isActive(path)
      ? "block px-4 py-3 rounded-xl text-base font-bold text-emerald-900 bg-emerald-50"
      : "block px-4 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-50"
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-extrabold tracking-tighter text-emerald-900 font-headline">Logistics Portal</Link>
          <div className="hidden md:flex gap-8 items-center">
            {isAuthenticated && (
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                Dashboard
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/purchase-orders" className={linkClass('/purchase-orders')}>
                Orders
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/freight-bookings" className={linkClass('/freight-bookings')}>
                Freight
              </Link>
            )}
            {canManageUsers() && (
              <Link to="/entities" className={linkClass('/entities')}>
                Entities
              </Link>
            )}
            {canManageUsers() && (
              <Link to="/users" className={linkClass('/users')}>
                Users
              </Link>
            )}
            {canManageUsers() && (
              <Link to="/custom-field-definitions" className={linkClass('/custom-field-definitions')}>
                Custom Fields
              </Link>
            )}
            {canManageUsers() && (
              <Link to="/external-parties" className={linkClass('/external-parties')}>
                Parties
              </Link>
            )}
            {canManageUsers() && (
              <Link to="/notification-rules" className={linkClass('/notification-rules')}>
                Rules
              </Link>
            )}
            {canManageUsers() && (
              <Link to="/po-states" className={linkClass('/po-states')}>
                States
              </Link>
            )}
            {canManageUsers() && (
              <Link to="/po-transition-rules" className={linkClass('/po-transition-rules')}>
                Transitions
              </Link>
            )}
            {canManageUsers() && (
              <Link to="/settings/freight-rates" className={linkClass('/settings/freight-rates')}>
                Freight Rates
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <button className="p-2 hover:bg-emerald-50/50 rounded-lg transition-all text-emerald-800">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 hover:bg-emerald-50/50 rounded-lg transition-all text-emerald-800">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform"
                >
                  <img 
                    alt="User profile avatar" 
                    className="w-full h-full object-cover" 
                    src={user?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDqhH4zzXl5JY4J-O9n5T3MXPbaK6qDXxrZl_Rh-tFDXht-miZnqQiYpKkbvGly-31nwDUAira6ibIh0uI_zOCnncgP1XC82CepYoGRH_o8BfXSGmy6xn3m8oCm86eO92AbpUcDvtgsrXcwFLBnWMXEvMtvT-fTrY2qD2UFm-YIzY7M-c9ZloxzYPXksULd8VQjIlafMgc0Zu8PSkcxSezsXAtJZoo7HKJKLm7XFr1h5Igzy8EkzpJfJ5pGARE9MXuQFxjzt0vjIw2y"} 
                  />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none text-slate-800 border border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <div className="text-sm font-bold text-slate-900">{user?.first_name} {user?.last_name}</div>
                      <div className="text-xs text-slate-500 font-medium truncate">{user?.email}</div>
                    </div>
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm font-bold hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm font-bold text-error hover:bg-error/5 transition-colors border-t border-slate-50 mt-1"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="bg-primary text-on-primary px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all">
              Sign In
            </Link>
          )}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-emerald-800"
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-6 space-y-1 shadow-xl animate-in slide-in-from-top-full duration-300">
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className={mobileLinkClass('/dashboard')}>Dashboard</Link>
              <Link to="/purchase-orders" className={mobileLinkClass('/purchase-orders')}>Purchase Orders</Link>
              <Link to="/freight-bookings" className={mobileLinkClass('/freight-bookings')}>Freight Bookings</Link>
            </>
          )}
          {canManageUsers() && (
            <>
              <Link to="/entities" className={mobileLinkClass('/entities')}>Entities</Link>
              <Link to="/users" className={mobileLinkClass('/users')}>Users</Link>
              <Link to="/custom-field-definitions" className={mobileLinkClass('/custom-field-definitions')}>Custom Fields</Link>
              <Link to="/external-parties" className={mobileLinkClass('/external-parties')}>External Parties</Link>
              <Link to="/notification-rules" className={mobileLinkClass('/notification-rules')}>Notification Rules</Link>
              <Link to="/po-states" className={mobileLinkClass('/po-states')}>PO States</Link>
              <Link to="/po-transition-rules" className={mobileLinkClass('/po-transition-rules')}>Transitions</Link>
              <Link to="/settings/freight-rates" className={mobileLinkClass('/settings/freight-rates')}>Freight Rates</Link>
            </>
          )}
          <hr className="border-slate-100 my-2" />
          {isAuthenticated ? (
            <>
              <Link to="/profile" className={mobileLinkClass('/profile')}>Profile</Link>
              <button onClick={handleLogout} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-error hover:bg-error/5">Logout</button>
            </>
          ) : (
            <Link to="/login" className="block px-4 py-3 rounded-xl text-base font-bold text-sky-900">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  )
}
