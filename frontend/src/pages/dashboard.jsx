import { useEffect, useState } from "react";
import api from "../utils/api";
import DashboardLayout from "../components/dashboardLayout";
import { Skeleton } from "../components/skeleton";

const STAGE_COLORS = {
  APPLIED: "bg-[#8b6df6]",
  SHORTLISTED: "bg-[#7bcf9a]",
  ASSESSMENT: "bg-[#ffb26b]",
  INTERVIEW: "bg-[#7a8dfd]",
};

const VERDICT_COLORS = {
  ACCEPTED: "bg-green-600",
  REJECTED: "bg-red-600",
  GHOSTED: "bg-black",
};

export default function Dashboard() {
  const [username, setUsername] = useState("there");
  const [stageStats, setStageStats] = useState([]);
  const [verdictStats, setVerdictStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    const res = await api.get("/jobs/dashboard/");
    setStageStats(res.data.by_stage || []);
    setVerdictStats(res.data.by_verdict || []);
  };

  useEffect(() => {
    const name =
      localStorage.getItem("username") ||
      localStorage.getItem("email")?.split("@")[0];

    if (name) setUsername(name);

    fetchDashboardStats().finally(() => setLoading(false));
  }, []);


  useEffect(() => {
    const handler = () => fetchDashboardStats();
    window.addEventListener("jobs-updated", handler);
    return () => window.removeEventListener("jobs-updated", handler);
  }, []);

  const getStageCount = (stage) =>
    stageStats.find((s) => s.stage === stage)?.count || 0;

  const getVerdictCount = (verdict) =>
    verdictStats.find((v) => v.verdict === verdict)?.count || 0;

  const totalActive = Object.keys(STAGE_COLORS)
    .map(getStageCount)
    .reduce((a, b) => a + b, 0);

  return (
    <DashboardLayout>
      <section className="dashboard-card p-6 mb-10">
        {loading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <>
            <h1 className="text-2xl font-semibold">
              Welcome back,{" "}
              <span className="text-purple-600">{username}</span>
            </h1>
            <p className="text-gray-600">
              You currently have{" "}
              <b>{totalActive}</b> active applications.
            </p>
          </>
        )}
      </section>

      <section className="dashboard-card p-6">
        {Object.keys(STAGE_COLORS).map((stage) => (
          <div key={stage} className="mb-4">
            <div className="flex justify-between text-sm">
              <span>{stage}</span>
              <span>{getStageCount(stage)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full">
              <div
                className={`${STAGE_COLORS[stage]} h-full`}
                style={{
                  width: totalActive
                    ? `${(getStageCount(stage) / totalActive) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        ))}
      </section>
    </DashboardLayout>
  );
}
