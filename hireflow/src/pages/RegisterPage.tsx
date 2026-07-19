import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

export function RegisterPage() {
  const { register, isLoading, error: authError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const success = await register(email, password, name);
    if (!success) {
      setError("Email already exists");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-semibold text-accent">HireFlow</h1>
          <p className="mt-1 font-sans text-sm text-muted">AI Recruitment Pipeline</p>
        </div>

        {/* Register Card */}
        <div className="rounded-lg border border-border bg-surface p-8">
          <h2 className="mb-6 font-mono text-lg font-medium text-text">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || authError) && (
              <div className="rounded border border-danger bg-surface2 px-3 py-2 text-xs text-danger">
                {error || authError}
              </div>
            )}

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded border border-border2 bg-surface2 px-3 py-2.5 text-xs text-text outline-none transition-colors focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded border border-border2 bg-surface2 px-3 py-2.5 text-xs text-text outline-none transition-colors focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded border border-border2 bg-surface2 px-3 py-2.5 text-xs text-text outline-none transition-colors focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded border border-border2 bg-surface2 px-3 py-2.5 text-xs text-text outline-none transition-colors focus:border-accent"
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full justify-center"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-4 text-center text-xs text-muted">
            Already have an account?{" "}
            <a href="/login" className="text-accent hover:text-accent-hover">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}