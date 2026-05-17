"use client";

import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Blobs - Jade Theme */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#B7E5BA]/30 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#5CA87C]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-[#288760]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[#1A5140]/10 rounded-full blur-3xl" />
      </div>

      <Navigation />

      <main className="relative">
        {/* Hero Section */}
        <section className="container mx-auto px-4 flex items-center justify-center text-center" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Turn Academic Talent Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5CA87C] to-[#288760]">Real Solutions</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Solvad connects university students with real industry challenges,
              building portfolios that matter while solving problems that count.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-[#5CA87C] hover:bg-[#288760] text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Sign Up Now
              </Link>
              <Link
                href="#how-it-works"
                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border-2 border-gray-200 transition-all hover:border-[#5CA87C]"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <hr className="border-t border-gray-200" />
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  How It Works
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  A simple three-step process connecting real problems with
                  academic solutions
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mt-12">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#B7E5BA] to-[#5CA87C] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Submit
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Industry partners post operational or technical
                    challenges, tagging the required academic discipline.
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-[#5CA87C]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#5CA87C] to-[#288760] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Match
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Our rule-based engine filters these challenges directly
                    to students enrolled in those specific degree programs.
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-[#5CA87C]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#288760] to-[#1A5140] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Solve
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Students claim the project, collaborate on solutions,
                    and build a verified portfolio of real-world impact.
                  </p>
                </div>
              </div>

              <div className="text-center pt-8">
                <Link
                  href="/problems"
                  className="inline-flex px-8 py-3 bg-[#5CA87C] hover:bg-[#288760] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  View Problems
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <hr className="border-t border-gray-200" />
        </div>

        {/* For Students Section */}
        <section id="for-students" className="container mx-auto px-4 py-20 bg-gradient-to-br from-gray-50/50 to-white">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Stop building toy projects.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5CA87C] to-[#288760]">
                    Solve real industry bottlenecks.
                  </span>
                </h2>
              </div>

              {/* Dashboard Mockup */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200 shadow-inner">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="font-semibold text-gray-900">
                      Your Matched Problems
                    </h3>
                    <span className="text-xs bg-[#5CA87C] text-white px-3 py-1 rounded-full">
                      BS Information Technology
                    </span>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-[#B7E5BA]/20 transition-colors border border-gray-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-[#5CA87C] to-[#288760] rounded-lg flex items-center justify-center text-white font-bold">
                        {i}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          Industry Challenge Title {i}
                        </h4>
                        <p className="text-xs text-gray-600">
                          Company Name • Posted 2 days ago
                        </p>
                      </div>
                      <div className="text-xs text-[#288760] font-medium">
                        View →
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Solvad bridges the gap between your academic coursework
                  and real-world application. Register with your university
                  and degree program to unlock a curated feed of active
                  challenges. Claim a project, apply your skills, and build
                  a verifiable portfolio before you even graduate.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Instead of searching for capstone ideas, browse real
                  technical and operational challenges submitted by actual
                  companies. Our rule-based matchmaking engine instantly
                  filters and displays the exact industry problems that
                  require your academic background.
                </p>
              </div>

              <div className="text-center pt-4">
                <Link
                  href="/register"
                  className="inline-flex px-8 py-3 bg-[#5CA87C] hover:bg-[#288760] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Sign Up as a Solver
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <hr className="border-t border-gray-200" />
        </div>

        {/* For Industry Section */}
        <section id="for-industry" className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Turn your unresolved problems
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5CA87C] to-[#288760]">
                    into academic capstones.
                  </span>
                </h2>
              </div>

              {/* AI Problem Breakdown Mockup */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200 shadow-inner">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#5CA87C] to-[#288760] rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        AI Problem Analysis
                      </h3>
                      <p className="text-xs text-gray-600">
                        Automated breakdown for optimal matching
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="text-xs font-medium text-gray-500 w-32">
                        Discipline:
                      </span>
                      <span className="text-xs bg-[#5CA87C] text-white px-3 py-1 rounded-full">
                        BS Information Technology
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-xs font-medium text-gray-500 w-32">
                        Complexity:
                      </span>
                      <span className="text-xs text-gray-700">
                        Intermediate
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-xs font-medium text-gray-500 w-32">
                        Estimated Time:
                      </span>
                      <span className="text-xs text-gray-700">
                        4-6 weeks
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-xs font-medium text-gray-500 w-32">
                        Skills Required:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {["React", "Node.js", "Database Design"].map(
                          (skill) => (
                            <span
                              key={skill}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Connect your organization with top-tier university talent
                  eager to solve real-world problems. Whether you're facing
                  software bugs, supply chain delays, or engineering
                  bottlenecks, our platform routes your issues to the right
                  academic minds.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Submit your problem context, tag the specific academic
                  discipline you need, and our system instantly distributes
                  your challenge to verified students equipped to provide
                  fresh perspectives. Build your talent pipeline while
                  solving real problems.
                </p>
              </div>

              <div className="text-center pt-4">
                <Link
                  href="/submit-problem"
                  className="inline-flex px-8 py-3 bg-[#5CA87C] hover:bg-[#288760] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Submit a Problem
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
