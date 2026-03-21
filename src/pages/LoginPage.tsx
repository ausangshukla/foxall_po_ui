import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoginError, ValidationError } from '../types/api'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)

    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof LoginError) {
        setError(err.message)
      } else if (err instanceof ValidationError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background font-body text-on-surface overflow-x-hidden min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-xl docked full-width top-0 sticky z-50 shadow-sm dark:shadow-none tonal-shift bg-slate-100/50 dark:bg-slate-900/50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-full mx-auto">
          <div className="text-xl font-bold text-sky-900 dark:text-sky-100 tracking-tighter font-headline">Foxall PO</div>
          <div className="flex items-center gap-8 font-['Plus_Jakarta_Sans'] font-medium tracking-tight">
            <Link className="text-sky-800 dark:text-sky-200 font-semibold border-b-2 border-sky-600" to="/login">Login</Link>
            <a className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300 px-3 py-1 rounded-lg" href="#">Support</a>
          </div>
        </div>
      </nav>

      <main className="relative flex-grow flex items-center justify-center py-20 px-4 overflow-hidden">
        {/* Dynamic Background Container */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="grid grid-cols-2 gap-4 scrolling-bg">
            <div className="space-y-4">
              <img className="w-full aspect-video object-cover rounded-xl" alt="Aerial view of a massive container ship" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALzl4rqHZDHhLspOtOQgW8lPN2bhCE-bAJCCx3twuQz2sgP7F5nPteL_XY1GJOPKuNAln2W7MthgFOdO1dzeHfX_MWWOBtdV08Cj4L5gXrUgOn6-yZZfAIKYoSOpcOJjOnp6xZ84RMaWr36kgBqxNO3LOvhwOXcUpN60-2QS4EmIjvUyLHI_2vPAoxV6T0UxxgMo9xP6IL8sCb47kFu2hHpPIJxghejtrTltXRvAP4esxvZHkN-7fm2r8fbDYIpkWDJtnRFuIQ4YOy"/>
              <img className="w-full aspect-square object-cover rounded-xl" alt="Fleet of modern white freight trucks" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF1on8GFPjpeqPw254Qdj8P1QLo_kDCqZP0VqtHC4XujRJ7o_6-EvDHHh20G2EnOycPNz3oqziP77LmSRzjNbt0Exhti0UEx6KQn49VWLBznQkBQovvIQ8areoLzIRQ62dDFMbWErHp-DoQVDjjeHh4n2bK53f2LekHJ1qddosqkPRD8NkE3ZimnyfZ9jDHPVBS5yajdZRtFkmitEFM12nSPboCy8r-XsW5aOAxW08kzjVzZy76OasT7Fm69IWBMZfSQmymNCQvS4h"/>
              <img className="w-full aspect-video object-cover rounded-xl" alt="Interior of a large distribution center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChxxAj0PaIahWYmcK81y4CoXm1HHZFK0wRAWFZY5Ji9dfyGtJdGlGIU4S5A9kw28kHoJxUiWkxU5VtH1p5pgZvZ3i7UbOi3irPcfM5D4jbgAHMaibamyQwI1UNwYmTbOD5BCoSL8aVaip2Zcbi9W7kIsm9o1sy1Cqh5q9q_Gkii_E-Thfq95KXXN0sv11AI14z4j36_HaZaTPpK5k-zRIBZolRa_Jz3QJ9XdrEh_sKrqJyMCw7uIIanzigMAJFgQnXGaKFal8lXSXO"/>
              <img className="w-full aspect-square object-cover rounded-xl" alt="Cargo plane being loaded at night" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMNeEgHwA8afO0hsV-GrmRQh-lIVgfbUp1VJD_UPtAF13EljQ6C0SDy7hSyxyudkO3F6g1j30LvfOW_ngn6NHqnhUCYtNZ1PhmGPCLGzHr7hSokLVu-xTxzsFJIx1DkBfIWkc6cLzA5Im0nigr8m2G44V3ZhZNn6LRS0A5qGwVn9RcedCNSA6vKKZ7aSdETGD6uYSwsXEpUNzFxyt8frrukat97NpNLEsM9a1KCi5nilmPZKEm6nQg0APSjxn6vx86bQYRRm9nVVKj"/>
            </div>
            <div className="space-y-4 mt-20">
              <img className="w-full aspect-square object-cover rounded-xl" alt="Logistics hub with thousands of containers" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC60D91c_GtIbhbME955QJX6M1LLT8dDHW1x674Jb6EgvT501bAegvSuFUpcABSC3uuGCQUHxnUJErp8KrPxA_P-bn-vQfTIT0Xn_3PRetVMgnPmFTmRmS1s_x5KQuOJdOg1_P2kqi0u0yLCZeXiWQL9RVK5pv598AdEQj2-Qqr08tbBUd8ZndSkLPEhLbUR8w1Nc6-cwFUvcB9TLIYQJ6_zCTz7pjMIPAVPVuFfMgnXdNSWyXYBRyHtN4Wr-8o5qv5Of8dwdYPcOon"/>
              <img className="w-full aspect-video object-cover rounded-xl" alt="Heavy lifting machinery in a port" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLLOjEbjuXi9xzGngUKqSpKEadBjMz8UXXSr6V8kRD5I4IIuMkBlcgmYQJuW8J_DgzNpKnB6Ket72wFfz7H1S8Ybhq7yyk4c-iRkxnNZmL0NCUNYSkkmUtXsdjGY7a9p1uyrzl1NK0kwpvnZix8DAZZ_nHMvcdn5PyFJhAp3PCllkG8RJ6bAsSZNMsu_U2X5eU5_TmHYX8PI4AMLH-3QZK79ED0F84ZtYI53VRYnQEDpqjWvcRKkvJNExYqGnyhTupU5tj-6rDH_31"/>
              <img className="w-full aspect-square object-cover rounded-xl" alt="Close up of logistics tracking hardware" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwvLvz3B7QzQSJVX_tdciXLx7K_1UKaI6XFEuYBOtCa37YOqZET3CFeBWVNBW0_GIbzkOhezE5Fw6L55rbNjJVRNqqLFPFxgcYBJl11Hz8eVew41L-C7JKVueYO2PHaw8AeJxdUEweANshtu3zIat5reThGkIz-bzGuLdg3aqB7wnWmWAicbG6CESxkrXL5S4SqwG3QYLlbfPpF-Po3KsOPMPw6sBaHpMRVZ2xuQdGVC2NYTkSTp-daznecvbueJzySbvh8P-e_pu-"/>
              <img className="w-full aspect-video object-cover rounded-xl" alt="Team of logistics professionals in warehouse" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxilliiOJQTU_zEl6nIW44fYBQ9-XFro0t7mbfB_CI6nQ26LuRq5BCZzfoopX4aknQwq5NiCQq5Oi_6iBQ4ubnNt6VYXsQZyifbD_ob-nk4ASx6d6i7Cdt1PcWNcGf3LkizbEg7iG6Cx4PY6RU2KtuYTS2YEwuz0EWTi0hOZAse0fO0_Au-gGQzQtv2UAZQpPMogeIxK1pHcZ_DFzooSnQJk0qo1TS2fYcjPINrcL-iD-GgPaFBSR6dh8eGZdFRhCFHi4hWx1fdYRe"/>
            </div>
          </div>
        </div>
        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-surface-container-lowest/80 backdrop-blur-2xl p-10 rounded-[2rem] editorial-shadow border border-white/40">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container mb-6">
                <span className="material-symbols-outlined text-on-primary-container text-3xl">anchor</span>
              </div>
              <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-2">Welcome Back</h1>
              <p className="text-on-surface-variant font-medium">Access your global fleet portal</p>
            </div>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error-container text-on-error-container text-sm font-medium">
                {error}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input 
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all" 
                    placeholder="name@foxall.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Password</label>
                  <a className="text-xs font-bold text-primary hover:underline underline-offset-4" href="#">Forgot?</a>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input 
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container-low" id="remember" type="checkbox"/>
                <label className="text-sm font-medium text-on-surface-variant" htmlFor="remember">Keep me logged in</label>
              </div>
              <button 
                className="w-full bg-primary hover:bg-primary-dim text-on-primary py-4 rounded-full font-headline font-bold text-lg shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Log In to Portal'}
              </button>
            </form>
            <div className="mt-10 pt-8 border-t border-outline-variant/20">
              <p className="text-center text-sm text-on-surface-variant font-medium">
                New to Foxall? 
                <a className="text-primary font-bold hover:underline underline-offset-4 ml-1" href="#">Request Access</a>
              </p>
            </div>
          </div>
          {/* Contextual Status/Support Chip */}
          <div className="mt-8 flex justify-center">
            <div className="bg-tertiary-container/50 backdrop-blur-md px-4 py-2 rounded-full border border-tertiary/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
              <span className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider">All Systems Operational</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50 dark:bg-slate-950 font-['Be_Vietnam_Pro'] text-sm tonal-shift bg-slate-100 dark:bg-slate-900 border-t-0 full-width">
        <div className="text-slate-500 dark:text-slate-400">
          © 2024 Foxall PO Logistics. All rights reserved.
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          <a className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 underline-offset-4 hover:underline transition-colors duration-200" href="#">Fleet Tracking</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 underline-offset-4 hover:underline transition-colors duration-200" href="#">Global Support</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 underline-offset-4 hover:underline transition-colors duration-200" href="#">Security</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 underline-offset-4 hover:underline transition-colors duration-200" href="#">Terms of Service</a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 underline-offset-4 hover:underline transition-colors duration-200" href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  )
}
