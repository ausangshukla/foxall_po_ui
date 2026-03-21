import { Outlet } from 'react-router-dom'
import { AppNavbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <AppNavbar />
      <main className="pt-24 pb-12">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-100 w-full mt-20 border-t border-slate-200/20">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-12 py-10 max-w-screen-2xl mx-auto">
          <div className="mb-6 md:mb-0">
            <span className="font-headline font-bold text-slate-900 text-lg">Foxall PO</span>
            <p className="text-xs text-slate-500 mt-2 font-body">© 2024 Foxall PO Logistics. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="text-slate-500 hover:text-sky-600 transition-colors text-sm font-body focus:underline decoration-sky-500 underline-offset-4" href="#">Support Center</a>
            <a className="text-slate-500 hover:text-sky-600 transition-colors text-sm font-body focus:underline decoration-sky-500 underline-offset-4" href="#">Legal Terms</a>
            <a className="text-slate-500 hover:text-sky-600 transition-colors text-sm font-body focus:underline decoration-sky-500 underline-offset-4" href="#">Privacy Policy</a>
            <a className="text-slate-500 hover:text-sky-600 transition-colors text-sm font-body focus:underline decoration-sky-500 underline-offset-4" href="#">Global Network</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
