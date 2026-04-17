import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/common'
import { DelayAlertsWidget } from '../components/freight/DelayAlertsWidget'

export function DashboardPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()

  if (!isAuth) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-0 max-w-screen-2xl mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Editorial Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">
            Welcome, {user?.first_name}!
          </h1>
          <p className="text-on-surface-variant font-light tracking-wide max-w-2xl">
            You are currently managing the platform as a <span className="font-bold text-primary capitalize">{user?.roles.join(', ')}</span>. 
            Access your global procurement tools and system configurations below.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/purchase-orders/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Purchase Order</span>
          </button>
        </div>
      </header>

      <DelayAlertsWidget />

      {/* Summary Metrics: Glass Bento */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div 
          onClick={() => navigate('/purchase-orders')}
          className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44 cursor-pointer hover:scale-[1.02] transition-transform group"
        >
          <div className="flex justify-between items-start">
            <span className="p-3 bg-primary-container/30 text-primary rounded-xl material-symbols-outlined group-hover:scale-110 transition-transform">shopping_cart</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Orders</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">Manage Grid</h3>
          </div>
        </div>
        
        {(hasRole('super') || hasRole('internal_manager')) && (
          <div 
            onClick={() => navigate('/users')}
            className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44 cursor-pointer hover:scale-[1.02] transition-transform group"
          >
            <div className="flex justify-between items-start">
              <span className="p-3 bg-tertiary-container/30 text-tertiary rounded-xl material-symbols-outlined group-hover:scale-110 transition-transform">group</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Directory</p>
              <h3 className="text-3xl font-extrabold text-on-primary-container">User Base</h3>
            </div>
          </div>
        )}

        {hasRole('super') && (
          <div 
            onClick={() => navigate('/entities')}
            className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44 cursor-pointer hover:scale-[1.02] transition-transform group"
          >
            <div className="flex justify-between items-start">
              <span className="p-3 bg-secondary-container/30 text-secondary rounded-xl material-symbols-outlined group-hover:scale-110 transition-transform">domain</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Network</p>
              <h3 className="text-3xl font-extrabold text-on-primary-container">Entities</h3>
            </div>
          </div>
        )}

        <div 
          onClick={() => navigate('/profile')}
          className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44 cursor-pointer hover:scale-[1.02] transition-transform group"
        >
          <div className="flex justify-between items-start">
            <span className="p-3 bg-surface-container-highest text-on-surface-variant rounded-xl material-symbols-outlined group-hover:scale-110 transition-transform">person</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Identity</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">My Profile</h3>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden p-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-on-primary-container mb-4">System Overview</h2>
          <p className="text-on-surface-variant mb-8 font-light leading-relaxed">
            Welcome to the Foxall PO editorial interface. This dashboard provides a high-level entry point into your procurement lifecycle. 
            Use the cards above to navigate to specific management modules. The system is currently optimized for global logistics tracking and entity-based user permissioning.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10">
              <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Quick Actions
              </h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => navigate('/purchase-orders')} className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    Review Pending Approvals
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/profile')} className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    Update Notification Settings
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10">
              <h4 className="font-bold text-secondary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                Platform Status
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-medium text-on-surface-variant">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
