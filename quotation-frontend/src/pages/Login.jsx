import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/api";
import { setAuth } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/login", { email, password });
      setAuth(data);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="card-surface w-full max-w-md rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">
          Quotation System
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          Sign in to continue
        </p>

        <input
          type="email"
          placeholder="Email"
          className="w-full border border-slate-200 p-3 mb-4 rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border border-slate-200 p-3 mb-2 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="mb-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-700 p-3 text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="mt-3 w-full rounded-lg border border-slate-200 bg-white/70 p-3 text-sm text-slate-700 transition hover:bg-white"
        >
          Register as Technician
        </button>
      </form>
    </div>
  );
}
