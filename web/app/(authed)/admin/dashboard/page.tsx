"use client";

import { useAuth } from "@/context/auth-context";

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-background to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-medium text-purple-600">{user?.email}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Users
            </h3>
            <p className="text-3xl font-bold text-purple-600">1,247</p>
            <p className="text-sm text-gray-600 mt-2">Active platform users</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Solvers
            </h3>
            <p className="text-3xl font-bold text-green-600">892</p>
            <p className="text-sm text-gray-600 mt-2">Student solvers</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Seekers
            </h3>
            <p className="text-3xl font-bold text-blue-600">355</p>
            <p className="text-sm text-gray-600 mt-2">Industry partners</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Problems
            </h3>
            <p className="text-3xl font-bold text-pink-600">523</p>
            <p className="text-sm text-gray-600 mt-2">Total posted</p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-left">
                Manage Users
              </button>
              <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-left">
                Review Problems
              </button>
              <button className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-left">
                View Analytics
              </button>
              <button className="w-full px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors text-left">
                System Settings
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {[
                { action: "New solver registered", time: "5 minutes ago", type: "user" },
                { action: "Problem posted by TechCorp", time: "15 minutes ago", type: "problem" },
                { action: "Solution submitted", time: "1 hour ago", type: "solution" },
                { action: "New seeker verified", time: "2 hours ago", type: "user" },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === "user" ? "bg-purple-600" :
                    activity.type === "problem" ? "bg-blue-600" : "bg-green-600"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
