"use client";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Users
            </h3>
            <p className="text-3xl font-bold text-accent">1,247</p>
            <p className="text-sm text-gray-600 mt-2">Active platform users</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Solvers
            </h3>
            <p className="text-3xl font-bold text-secondary">892</p>
            <p className="text-sm text-gray-600 mt-2">Student solvers</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Seekers
            </h3>
            <p className="text-3xl font-bold text-primary-foreground">355</p>
            <p className="text-sm text-gray-600 mt-2">Industry partners</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Problems
            </h3>
            <p className="text-3xl font-bold text-accent">523</p>
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
              <button className="w-full px-6 py-3 bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors text-left">
                Manage Users
              </button>
              <button className="w-full px-6 py-3 bg-secondary hover:bg-primary-foreground text-white font-medium rounded-lg transition-colors text-left">
                Review Problems
              </button>
              <button className="w-full px-6 py-3 bg-primary-foreground hover:bg-secondary text-white font-medium rounded-lg transition-colors text-left">
                View Analytics
              </button>
              <button className="w-full px-6 py-3 bg-accent hover:bg-secondary text-white font-medium rounded-lg transition-colors text-left">
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
                    activity.type === "user" ? "bg-accent" :
                    activity.type === "problem" ? "bg-secondary" : "bg-primary-foreground"
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
