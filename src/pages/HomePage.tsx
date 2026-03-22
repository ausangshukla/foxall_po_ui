import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="text-center py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container mb-6 shadow-inner">
          <span className="material-symbols-outlined text-on-primary-container text-4xl" data-icon="anchor">anchor</span>
        </div>
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-on-surface tracking-tighter mb-4">
          Logistics <span className="text-primary italic">Precision</span>
        </h1>
        <p className="font-body text-base md:text-lg text-on-surface-variant mb-6 leading-relaxed max-w-2xl mx-auto">
          The unified purchase order platform for global shipping fleet logistics. 
          Manage entities, users, and cargo operations with unmatched efficiency.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-6 py-2.5 bg-primary hover:bg-primary-dim text-on-primary rounded-full font-headline font-bold text-base shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.05] active:scale-95 flex items-center gap-2"
            >
              Go to Dashboard
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-2.5 bg-primary hover:bg-primary-dim text-on-primary rounded-full font-headline font-bold text-base shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.05] active:scale-95 flex items-center gap-2"
              >
                Log In to Portal
                <span className="material-symbols-outlined text-xl">login</span>
              </Link>
              <a
                href="#"
                className="px-6 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-full font-headline font-bold text-base transition-all flex items-center gap-2"
              >
                Global Support
                <span className="material-symbols-outlined text-xl">help</span>
              </a>
            </>
          )}
        </div>
        
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-5 rounded-[1.25rem] bg-surface-container-low border border-outline-variant/30 text-left editorial-shadow">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">analytics</span>
              <h3 className="text-base font-bold font-headline mb-1 text-on-surface">Advanced Fleet Analytics</h3>
              <p className="text-xs text-on-surface-variant font-body leading-relaxed">Real-time purchase order monitoring across all global shipping lanes.</p>
           </div>
           <div className="p-5 rounded-[1.25rem] bg-surface-container-low border border-outline-variant/30 text-left editorial-shadow">
              <span className="material-symbols-outlined text-tertiary text-2xl mb-2">security</span>
              <h3 className="text-base font-bold font-headline mb-1 text-on-surface">Secure Multi-Entity Control</h3>
              <p className="text-xs text-on-surface-variant font-body leading-relaxed">Centralized management for multiple subsidiaries and global entities.</p>
           </div>
           <div className="p-5 rounded-[1.25rem] bg-surface-container-low border border-outline-variant/30 text-left editorial-shadow">
              <span className="material-symbols-outlined text-secondary text-2xl mb-2">sync_alt</span>
              <h3 className="text-base font-bold font-headline mb-1 text-on-surface">Seamless Integration</h3>
              <p className="text-xs text-on-surface-variant font-body leading-relaxed">Full lifecycle management from requisition to final delivery tracking.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
