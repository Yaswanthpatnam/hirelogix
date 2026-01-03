import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant";

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const resetRes = await api.post("/user/reset-password/", {
        uid,
        token,
        password,
        confirm_password: confirm,
      });

      const identifier = resetRes.data.identifier; // email

      const loginRes = await api.post("/user/login/", {
        identifier,
        password,
      });

      localStorage.setItem(ACCESS_TOKEN, loginRes.data.access);
      localStorage.setItem(REFRESH_TOKEN, loginRes.data.refresh);

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Reset link expired or invalid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9ff] px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-semibold text-center">Reset Password</h1>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input
          type="password"
          placeholder="New password"
          className="w-full h-12 border px-4 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm new password"
          className="w-full h-12 border px-4 rounded"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
