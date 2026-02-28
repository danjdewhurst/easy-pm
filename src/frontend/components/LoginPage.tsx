import React, { useState } from "react";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
}

export function LoginPage({ onLogin, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center" style={{ background: "var(--surface-0)" }}>
      <div
        className="w-full max-w-sm mx-4 p-8 rounded-2xl border animate-scale-in"
        style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
      >
        <h1 className="font-brand text-2xl mb-1" style={{ color: "var(--accent)" }}>
          easy-pm
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Sign in to your account
        </p>

        {error && (
          <div
            className="text-sm px-3 py-2 rounded-lg mb-4"
            style={{ background: "#ef444420", color: "#ef4444" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-150"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-150"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-medium rounded-lg transition-all duration-150 btn-press"
            style={{
              background: "var(--accent)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-xs mt-5 text-center" style={{ color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <button
            onClick={onNavigateToRegister}
            className="font-medium underline"
            style={{ color: "var(--accent)" }}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
