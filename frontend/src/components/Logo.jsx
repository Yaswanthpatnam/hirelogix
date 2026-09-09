import { useNavigate } from "react-router-dom";

export default function Logo() {
  const navigate = useNavigate();

  return (
    <h1
      onClick={() => navigate("/")}
      className="font-brand text-4xl text-white cursor-pointer select-none"
    >
      HireLogix
    </h1>
  );
}
