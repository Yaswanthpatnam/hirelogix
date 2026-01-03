import { useState } from "react";
import api from "../utils/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);
      await api.post("/user/forgot-password/", { email });
      setMessage("Password reset link sent to your email.");
    } catch {
      setError("If this email exists, a reset link was sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9ff] px-4">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-2xl shadow w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-semibold text-center">Forgot Password</h1>

        {message && (
          <p className="text-green-600 text-sm text-center">{message}</p>
        )}

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 border px-4 rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-purple-600 text-white rounded  transition-all duration-200
    hover:bg-[#d73782]
    hover:scale-[1.02]

    active:scale-[0.97]
    active:bg-[#c92f75]

    focus:outline-none"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
