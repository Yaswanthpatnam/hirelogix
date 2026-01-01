import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constant";
import Navbar from "../components/navBar";
import Hero from "../components/hero";
import BodySection from "../components/body";
import About from "../components/about";
import Footer from "../components/footer";

export default function Home() {
  const token = localStorage.getItem(ACCESS_TOKEN);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar />
      <Hero />
      <BodySection />
      <About />
      <Footer />
    </div>
  );
}
