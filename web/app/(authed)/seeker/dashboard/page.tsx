"use client";

import { useAuth } from "@/context/auth-context";

export default function SeekerDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Seeker Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-medium text-indigo-600">{user?.email}</span>
              </p>
            </div>
            <button
              onClick={logout}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Posted Problems
            </h3>
            <p className="text-3xl font-bold text-blue-600">8</p>
            <p className="text-sm text-gray-600 mt-2">Total problems posted</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              In Progress
            </h3>
            <p className="text-3xl font-bold text-indigo-600">5</p>
            <p className="text-sm text-gray-600 mt-2">Being worked on</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Solved
            </h3>
            <p className="text-3xl font-bold text-green-600">3</p>
            <p className="text-sm text-gray-600 mt-2">Successfully completed</p>
          </div>
        </div>

        {/* Posted Problems */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Posted Problems
            </h2>
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              Post New Problem
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {i}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    Industry Problem Title {i}
                  </h4>
                  <p className="text-xs text-gray-600">
                    Posted 5 days ago • {i * 2} solvers interested
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    View Proposals
                  </button>
                  <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
