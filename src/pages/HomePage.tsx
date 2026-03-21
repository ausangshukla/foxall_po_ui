import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="text-center py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary-container mb-12 shadow-inner">
          <span className="material-symbols-outlined text-on-primary-container text-6xl" data-icon="anchor">anchor</span>
        </div>
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-surface tracking-tighter mb-6">
          Logistics <span className="text-primary italic">Precision</span>
        </h1>
        <p className="font-body text-xl md:text-2xl text-on-surface-variant mb-12 leading-relaxed">
          The unified purchase order platform for global shipping fleet logistics. 
          Manage entities, users, and cargo operations with unmatched efficiency.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-10 py-5 bg-primary hover:bg-primary-dim text-on-primary rounded-full font-headline font-bold text-xl shadow-xl shadow-primary/20 transition-all transform hover:scale-[1.05] active:scale-95 flex items-center gap-3"
            >
              Go to Dashboard
              <span className="material-symbols-outlined text-2xl">arrow_forward</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-10 py-5 bg-primary hover:bg-primary-dim text-on-primary rounded-full font-headline font-bold text-xl shadow-xl shadow-primary/20 transition-all transform hover:scale-[1.05] active:scale-95 flex items-center gap-3"
              >
                Log In to Portal
                <span className="material-symbols-outlined text-2xl">login</span>
              </Link>
              <a
                href="#"
                className="px-10 py-5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-full font-headline font-bold text-xl transition-all flex items-center gap-3"
              >
                Global Support
                <span className="material-symbols-outlined text-2xl">help</span>
              </a>
            </>
          )}
        </div>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/30 text-left editorial-shadow">
              <span className="material-symbols-outlined text-primary text-4xl mb-4">analytics</span>
              <h3 className="text-xl font-bold font-headline mb-2 text-on-surface">Advanced Fleet Analytics</h3>
              <p className="text-on-surface-variant font-body leading-relaxed">Real-time purchase order monitoring across all global shipping lanes.</p>
           </div>
           <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/30 text-left editorial-shadow">
              <span className="material-symbols-outlined text-tertiary text-4xl mb-4">security</span>
              <h3 className="text-xl font-bold font-headline mb-2 text-on-surface">Secure Multi-Entity Control</h3>
              <p className="text-on-surface-variant font-body leading-relaxed">Centralized management for multiple subsidiaries and global entities.</p>
           </div>
           <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/30 text-left editorial-shadow">
              <span className="material-symbols-outlined text-secondary text-4xl mb-4">sync_alt</span>
              <h3 className="text-xl font-bold font-headline mb-2 text-on-surface">Seamless Integration</h3>
              <p className="text-on-surface-variant font-body leading-relaxed">Full lifecycle management from requisition to final delivery tracking.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
