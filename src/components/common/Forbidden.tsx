import { Link } from 'react-router-dom'

export function Forbidden() {
  return (
    <div className="container mx-auto py-5 text-center px-4">
      <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded shadow-sm">
        <h3 className="text-red-800 font-bold text-xl mb-3">Access Denied</h3>
        <p className="text-red-700 max-w-lg mx-auto">
          You don&apos;t have permission to access this page. Please contact your
          manager if you believe this is an error.
        </p>
      </div>
      <Link 
        to="/" 
        className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        Go Home
      </Link>
    </div>
  )
}
