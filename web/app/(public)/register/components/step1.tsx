import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useMemo } from "react";

interface Step1Props {
  data: {
    email: string;
    password: string;
    confirmPassword: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "Contains uppercase and lowercase letters",
    test: (password) => /[a-z]/.test(password) && /[A-Z]/.test(password),
  },
  {
    label: "Includes a special character (!@#$%^&*)",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export default function Step1({ 
  data, 
  onChange, 
  onSubmit, 
  isLoading,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: Step1Props) {
  const passwordValidation = useMemo(() => {
    return passwordRequirements.map((req) => ({
      label: req.label,
      met: req.test(data.password),
    }));
  }, [data.password]);

  const isPasswordValid = passwordValidation.every((req) => req.met);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      return;
    }
    
    if (data.password !== data.confirmPassword) {
      return;
    }
    
    onSubmit(e);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={data.email}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={onChange}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {data.password && (
          <div className="mt-3 space-y-2 p-3 rounded-lg bg-muted/50 border border-border animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Password Requirements:
            </p>
            {passwordValidation.map((req, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                    req.met
                      ? "bg-green-500/20 border border-green-500 scale-100"
                      : "bg-red-500/20 border border-red-500 scale-100"
                  }`}
                >
                  {req.met ? (
                    <svg
                      className="w-2.5 h-2.5 text-green-600 animate-in zoom-in duration-150"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-2.5 h-2.5 text-red-600 animate-in zoom-in duration-150"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-xs transition-all duration-200 ${
                    req.met ? "text-green-600 font-medium" : "text-red-600"
                  }`}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground"
        >
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={data.confirmPassword}
            onChange={onChange}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Passwords do not match
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        disabled={isLoading || !isPasswordValid || data.password !== data.confirmPassword}
        className="w-full font-semibold shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 transition-all"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </div>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );
}
