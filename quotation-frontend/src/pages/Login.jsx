import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/api";
import { setAuth } from "../utils/auth";
import { useI18n } from "../i18n/i18n";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useI18n();
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
      setError(t("auth.invalidCredentials"));
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
          {t("auth.loginTitle")}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          {t("auth.loginSubtitle")}
        </p>

        <input
          type="email"
          placeholder={t("auth.email")}
          className="w-full rounded-lg border border-slate-300 bg-white p-3 mb-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-slate-950 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:border-slate-200"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder={t("auth.password")}
          className="w-full rounded-lg border border-slate-300 bg-white p-3 mb-2 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-slate-950 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:border-slate-200"
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
          {loading ? t("auth.signingIn") : t("common.login")}
        </button>

        <button
          type="button"
          onClick={() => navigate("/technician")}
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/60"
        >
          {t("landing.goToTechnician")}
        </button>
      </form>
    </div>
  );
}
