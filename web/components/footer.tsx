import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Brand */}
          {/* Logo & Brand */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 self-start rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:scale-[0.98] transition-transform duration-200"
            >
              <img
                src="/solvad_logo.png"
                alt="Solvad Logo"
                className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-2xl font-extrabold leading-none tracking-tight text-gray-900 group-hover:text-emerald-600 transition-colors">
                Solvad
              </span>
            </Link>
            <p className="text-gray-600 text-sm">
              Connecting industry challenges with academic excellence.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Links</h3>
            <Link
              href="/about"
              className="text-gray-600 hover:text-primary-foreground transition-colors text-sm"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-primary-foreground transition-colors text-sm"
            >
              Contact Us
            </Link>
            <Link
              href="/privacy-policy"
              className="text-gray-600 hover:text-primary-foreground transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-gray-600 hover:text-primary-foreground transition-colors text-sm"
            >
              Terms and Conditions
            </Link>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 mb-2">Get Started</h3>
            <Link
              href="/register"
              className="text-gray-600 hover:text-primary-foreground transition-colors text-sm"
            >
              Sign Up as Solver
            </Link>
            <Link
              href="/submit-problem"
              className="text-gray-600 hover:text-primary-foreground transition-colors text-sm"
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
