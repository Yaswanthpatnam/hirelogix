
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/authLayout";
import api from "../utils/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/user/login/", {
        identifier: email,
        password,
      });

     
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

      const displayName =
        res.data.username ||
        res.data.email ||
        email;


      localStorage.setItem("username", displayName.split("@")[0]);
      localStorage.setItem("email", displayName);

      navigate("/dashboard", { replace: true });
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <AuthLayout title="Login">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 sm:space-y-8 w-full max-w-md mx-auto px-2"
      >
        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <input
          type="text"
          placeholder="Email / Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[48px] sm:h-[56px] md:h-[64px] border border-black px-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-[48px] sm:h-[56px] md:h-[64px] border border-black px-4"
        />

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-purple-600">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-[#E84393] text-white py-3 rounded-2xl"
        >
          Submit
        </button>
      </form>
    </AuthLayout>
  );
}