import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#5CA87C] to-[#288760] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Solvad</span>
            </div>
            <p className="text-gray-600 text-sm">
              Connecting industry challenges with academic excellence.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Links</h3>
            <Link
              href="/about"
              className="text-gray-600 hover:text-[#288760] transition-colors text-sm"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-[#288760] transition-colors text-sm"
            >
              Contact Us
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-[#288760] transition-colors text-sm"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 mb-2">Get Started</h3>
            <Link
              href="/register"
              className="text-gray-600 hover:text-[#288760] transition-colors text-sm"
            >
              Sign Up as Solver
            </Link>
            <Link
              href="/submit-problem"
              className="text-gray-600 hover:text-[#288760] transition-colors text-sm"
            >
              Submit a Problem
            </Link>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-600 text-sm">
            © 2026 Solvad. Cebu Institute of Technology - University.
          </p>
        </div>
      </div>
    </footer>
  );
}
