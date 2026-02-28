import React, { useState } from "react";

interface RegisterPageProps {
  onRegister: (email: string, password: string) => Promise<void>;
  onNavigateToLogin: () => void;
}

export function RegisterPage({ onRegister, onNavigateToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await onRegister(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          Create your account
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
              minLength={8}
              className="w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-150"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-xs mt-5 text-center" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <button
            onClick={onNavigateToLogin}
            className="font-medium underline"
            style={{ color: "var(--accent)" }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
