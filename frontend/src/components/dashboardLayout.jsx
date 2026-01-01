import DashboardNavbar from "./dashboardNavbar"
import DashboardFooter from "./dashboardFooter"
export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9ff]">
      <DashboardNavbar />

      <main className="flex-1 flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-6xl py-6 sm:py-10 space-y-8">
          {children}
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}