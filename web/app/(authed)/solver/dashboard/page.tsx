"use client";

export default function SolverDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Bridging the Gap Between Industry Problems and Academic Solutions.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto">
            Empowering student solvers to tackle real-world cross-industry challenges while building a verifiable portfolio.
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Available Problems
            </h3>
            <p className="text-3xl font-bold text-accent">12</p>
            <p className="text-sm text-gray-600 mt-2">New challenges matched to your profile</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Active Projects
            </h3>
            <p className="text-3xl font-bold text-secondary">3</p>
            <p className="text-sm text-gray-600 mt-2">Currently working on</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Completed
            </h3>
            <p className="text-3xl font-bold text-primary-foreground">7</p>
            <p className="text-sm text-gray-600 mt-2">Successfully solved</p>
          </div>
        </div>

        {/* Recent Problems */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Matched Problems
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-accent/20 transition-colors border border-gray-200"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold">
                  {i}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    Problem Title {i}
                  </h4>
                  <p className="text-xs text-gray-600">
                    Company Name • Posted 2 days ago • IT/Software Development
                  </p>
                </div>
                <button className="px-4 py-2 bg-accent hover:bg-secondary text-white text-sm font-medium rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
