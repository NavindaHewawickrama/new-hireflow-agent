import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const success = login(email, password);
    if (!success) {
      setError("Invalid email or password");
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

        {/* Login Card */}
        <div className="rounded-lg border border-border bg-surface p-8">
          <h2 className="mb-6 font-mono text-lg font-medium text-text">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded border border-danger bg-surface2 px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}

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

            <Button type="submit" variant="primary" className="w-full justify-center">
              Sign In
            </Button>
          </form>

          {/* Dummy credentials hint */}
          <div className="mt-6 rounded border border-border bg-surface2 p-3">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              Demo Credentials
            </p>
            <div className="space-y-1 text-[11px] text-muted2">
              <p>admin@hireflow.com / admin123</p>
              <p>recruiter@hireflow.com / recruit123</p>
            </div>
          </div>

          {/* Register link */}
          <p className="mt-4 text-center text-xs text-muted">
            Don't have an account?{" "}
            <a href="/register" className="text-accent hover:text-accent-hover">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}