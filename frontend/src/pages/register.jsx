import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/authLayout";
import api from "../utils/api";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const inputClass = `
    w-full
    h-[48px] sm:h-[56px] md:h-[64px]
    border border-black
    px-4 sm:px-5
    text-sm sm:text-base md:text-lg
    rounded-md
    outline-none
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !password || !confirm) {
      setError("All fields are required");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      await api.post("/user/register/", {
        username,
        email,
        password,
      });

      navigate("/login");
    } catch (err) {
      if (err.response?.data) {
        const firstError = Object.values(err.response.data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError("Registration failed");
      }
    }
  };

  return (
    <AuthLayout title="Register">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 sm:space-y-6 w-full max-w-md mx-auto px-2"
      >
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="submit"
            className="
              px-8 py-3
              bg-[#E84393]
              text-white
              rounded-2xl
               transition-all duration-200
    hover:bg-[#d73782]
    hover:scale-[1.02]

    active:scale-[0.97]
    active:bg-[#c92f75]

    focus:outline-none
              w-full sm:w-auto
            "
          >
            Submit
          </button>

          <Link to="/login" className="text-sm sm:text-base">
            I’m an existing user?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
