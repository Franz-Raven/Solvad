import Link from "next/link";
import { LoginForm } from "./components/LoginForm";
import { SocialLogin } from "./components/SocialLogin";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-white mb-4 shadow-lg shadow-secondary/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to continue to Solvad
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          
          {/* Client-Side Login Form Component */}
          <LoginForm />

          {/* Dumb Social Login Component */}
          <SocialLogin />

        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-secondary hover:text-accent transition-colors"
          >
            Sign up for free
          </Link>
        </p>
        
      </div>
    </div>
  );
}