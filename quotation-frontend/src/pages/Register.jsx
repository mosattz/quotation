import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/api";
import { setAuth } from "../utils/auth";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/register", {
        name,
        email,
        password,
        phone,
        zone,
      });
      setAuth(data);
      navigate("/technician");
    } catch (err) {
      setError("Registration failed. Try another email.");
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
          Technician Registration
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          Create your account to submit orders
        </p>

        <input
          type="text"
          placeholder="Full name"
          className="w-full border border-slate-200 p-3 mb-4 rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full border border-slate-200 p-3 mb-4 rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="tel"
          placeholder="Phone"
          className="w-full border border-slate-200 p-3 mb-4 rounded-lg"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <select
          className="w-full border border-slate-200 p-3 mb-4 rounded-lg bg-white"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          <option value="">Select zone</option>
          <option>CHALINZE</option>
          <option>LUGOBA</option>
          <option>MSOGA</option>
          <option>MIONO</option>
          <option>MDAULA</option>
          <option>MBWEWE</option>
          <option>KIWANGWA</option>
          <option>MSATA</option>
        </select>

        <input
          type="password"
          placeholder="Password"
          className="w-full border border-slate-200 p-3 mb-2 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-700 p-3 text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </div>
  );
}
