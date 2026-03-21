import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="container mx-auto py-5 text-center">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <h3 className="text-yellow-800 font-bold mb-2">Page Not Found</h3>
        <p className="text-yellow-700">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link 
        to="/" 
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}
