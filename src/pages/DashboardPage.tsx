import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/common'

export function DashboardPage() {
  const isAuth = useRequireAuth()
  const { user, hasRole } = useAuth()

  if (!isAuth) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome, {user?.first_name}!</h2>
          <p className="text-gray-500">
            You are logged in as{' '}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user?.roles.join(', ')}
            </span>
          </p>
        </div>

        {hasRole('super') && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-500 p-6">
            <h2 className="text-xl font-semibold text-blue-600 mb-2 font-bold">Super Admin</h2>
            <p className="text-gray-700">
              You have full access to manage all users and entities across the system.
            </p>
          </div>
        )}

        {hasRole('admin') && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-cyan-500 p-6">
            <h2 className="text-xl font-semibold text-cyan-600 mb-2 font-bold">Admin</h2>
            <p className="text-gray-700">
              You can manage users within your entity.
            </p>
          </div>
        )}

        {hasRole('employee') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Employee</h2>
            <p className="text-gray-700">
              You have access to view your profile information.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            <li>
              <a href="/profile" className="text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors">
                <span className="mr-2">→</span> View/Edit Profile
              </a>
            </li>
            {(hasRole('super') || hasRole('admin')) && (
              <li>
                <a href="/users" className="text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors">
                  <span className="mr-2">→</span> Manage Users
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
