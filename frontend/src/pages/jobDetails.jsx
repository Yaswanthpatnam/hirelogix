import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import DashboardLayout from "../components/dashboardLayout";

const STAGES = ["APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFER"];
const VERDICTS = ["ACCEPTED", "REJECTED", "GHOSTED"];

const STAGE_COLOR = {
  APPLIED: "bg-[#8b6df6]",
  SHORTLISTED: "bg-[#7bcf9a]",
  ASSESSMENT: "bg-[#ffb26b]",
  INTERVIEW: "bg-[#7a8dfd]",
  OFFER: "bg-[#c89cf6]",
};

const VERDICT_BADGE_COLOR = {
  ACCEPTED: "bg-green-600",
  REJECTED: "bg-red-600",
  GHOSTED: "bg-black",
};

const VERDICT_BUTTON_COLOR = {
  ACCEPTED: "bg-green-600 text-white",
  REJECTED: "bg-red-600 text-white",
  GHOSTED: "bg-black text-white",
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchJob = async () => {
    const res = await api.get(`/jobs/${id}/`);
    setJob(res.data);
  };

  useEffect(() => {
    fetchJob();
  }, []);

  const updateStage = async (stage) => {
    if (stage === job.stage) return;

    setLoading(true);
    await api.patch(`/jobs/${id}/stage/`, { stage });
    await fetchJob();
    setLoading(false);
  };

  const updateVerdict = async (verdict) => {
    setLoading(true);
    await api.patch(`/jobs/${id}/verdict/`, { verdict });
    await fetchJob();
    setLoading(false);
  };

  if (!job) return null;

  const offerBadgeColor =
    job.stage === "OFFER" && job.verdict
      ? VERDICT_BADGE_COLOR[job.verdict]
      : STAGE_COLOR[job.stage];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 ">

        <button
          onClick={() => navigate("/tracker")}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Tracker
        </button>

      
        <div className="dashboard-card section-hover p-6 sm:p-8 shadow">
          <h1 className="text-3xl font-semibold mb-1">{job.job_title}</h1>
          <p className="text-gray-500">{job.company}</p>

          <span
            className={`inline-block mt-4 px-5 py-1.5 rounded-full text-white text-sm ${offerBadgeColor}`}
          >
            {job.stage}
          </span>

          {job.stage === "OFFER" && job.verdict && (
            <p className="mt-3 text-sm font-medium text-gray-700">
              Verdict: <b>{job.verdict}</b>
            </p>
          )}
          <button
            onClick={async () => {
              if (!window.confirm("Delete this job application?")) return;
              await api.delete(`/jobs/${id}/`);
              navigate("/tracker");
            }}
            className="ml-4 text-sm text-red-600 hover:underline"
          >
            Delete Application
          </button>
        </div>

   
        <div className="dashboard-card section-hover p-6 sm:p-8 shadow">
          <h2 className="font-semibold mb-4 text-lg">Move Application</h2>

          <div className="flex gap-3 flex-wrap">
            {STAGES.map((stage) => (
              <button
                key={stage}
                disabled={loading}
                onClick={() => updateStage(stage)}
                className={`px-5 py-2 rounded-full text-sm transition-all ${
                  job.stage === stage
                    ? `${STAGE_COLOR[stage]} text-white shadow`
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

     
        {job.stage === "OFFER" && (
          <div className="bg-white rounded-3xl p-6 shadow">
            <h2 className="font-semibold mb-4 text-lg">Offer Verdict</h2>

            <div className="flex gap-3 flex-wrap">
              {VERDICTS.map((verdict) => (
                <button
                  key={verdict}
                  disabled={loading}
                  onClick={() => updateVerdict(verdict)}
                  className={`px-5 py-2 rounded-full text-sm transition-all ${
                    job.verdict === verdict
                      ? VERDICT_BUTTON_COLOR[verdict]
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {verdict}
                </button>
              ))}
            </div>
          </div>
        )}


        <div className="dashboard-card section-hover p-6 sm:p-8 shadow">
          <h2 className="font-semibold mb-4 text-lg">Application Details</h2>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <p>
              <b>Applied:</b> {job.applied_date}
            </p>
            <p>
              <b>Follow Up:</b> {job.follow_up_date || "—"}
            </p>
            <p>
              <b>Max Salary:</b> {job.max_salary || "—"}
            </p>
            <p>
              <b>Notes:</b> {job.notes || "—"}
            </p>
          </div>

          {job.resume && (
            <a
              href={job.resume}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-6 text-purple-700 font-medium underline underline-offset-4"
            >
              View Resume
            </a>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
