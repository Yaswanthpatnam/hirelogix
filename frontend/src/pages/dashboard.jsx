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

useEffect(() => {
  const name =
    localStorage.getItem("username") ||
    localStorage.getItem("email")?.split("@")[0];

  if (name) setUsername(name);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await api.get("/jobs/dashboard/");
    setStageStats(res.data.by_stage || []);
    setVerdictStats(res.data.by_verdict || []);
    setLoading(false);
  };

  fetchDashboard();

  const onStorage = (e) => {
    if (e.key === "jobs_updated_at") {
      fetchDashboard();
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
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
      {/* ✅ PERSONALIZED HEADER */}
      <section className="dashboard-card section-hover p-6 sm:p-10 mb-10">
        {loading ? (
          <>
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-6" />
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
              Welcome back, <span className="text-purple-600">{username}</span>
            </h1>

            <p className="text-gray-600">
              You currently have{" "}
              <b className="text-black">{totalActive}</b> active applications in
              progress.
            </p>
          </>
        )}
      </section>

      {/* PIPELINE */}
      <section className="dashboard-card section-hover p-6 sm:p-8">
        <h2 className="text-xl font-semibold mb-8">
          Your Application Pipeline
        </h2>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {/* ACTIVE STAGES */}
            <div className="space-y-4">
              {Object.keys(STAGE_COLORS).map((stage) => (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{stage}</span>
                    <span>{getStageCount(stage)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
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
            </div>

            {/* FINAL OUTCOMES */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">
                Final Outcomes
              </h3>

              <div className="space-y-4">
                {Object.keys(VERDICT_COLORS).map((verdict) => (
                  <div key={verdict}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{verdict}</span>
                      <span>{getVerdictCount(verdict)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`${VERDICT_COLORS[verdict]} h-full`}
                        style={{
                          width:
                            getVerdictCount(verdict) > 0
                              ? "100%"
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}


