import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import DashboardLayout from "../components/dashboardLayout";
import AddJobModal from "../components/addJobModel";

const STAGE_BG = {
  APPLIED: "bg-[#8b6df6]/90",
  SHORTLISTED: "bg-[#7bcf9a]/90",
  ASSESSMENT: "bg-[#ffb26b]/90",
  INTERVIEW: "bg-[#7a8dfd]/90",
};

const VERDICT_BG = {
  ACCEPTED: "bg-green-600/90",
  REJECTED: "bg-red-600/90",
  GHOSTED: "bg-black/90",
};

const chunk = (arr, size) =>
  arr.reduce((rows, item, i) => {
    if (i % size === 0) rows.push([]);
    rows[rows.length - 1].push(item);
    return rows;
  }, []);

export default function Tracker() {
  const [username, setUsername] = useState("there");
  const [jobs, setJobs] = useState([]);
  const [filterStage, setFilterStage] = useState("ALL");
  const [filterVerdict, setFilterVerdict] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const name =
      localStorage.getItem("username") ||
      localStorage.getItem("email")?.split("@")[0];

    if (name) setUsername(name);

    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await api.get("/jobs/");
    setJobs(res.data.results || []);
  };

const deleteJob = async (id, e) => {
  e.stopPropagation();
  if (!window.confirm("Delete this job application?")) return;

  await api.delete(`/jobs/${id}/`);

  localStorage.setItem("jobs_updated_at", Date.now().toString());

  fetchJobs();
};

  const visibleJobs = jobs.filter((job) => {
    if (filterStage === "ALL") return true;
    if (filterStage === "OFFER") return job.verdict === filterVerdict;
    return job.stage === filterStage;
  });

  const rows = chunk(visibleJobs, 3);

  const getCardBg = (job) =>
    job.stage === "OFFER" && job.verdict
      ? VERDICT_BG[job.verdict]
      : STAGE_BG[job.stage];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Let’s review your opportunities,{" "}
            <span className="text-purple-600">{username}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track, update, and move applications forward at your pace.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary w-fit"
        >
          + Add Job
        </button>
      </div>

      <div className="flex gap-3 mb-10 flex-wrap">
        {["ALL", "APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW"].map(
          (stage) => (
            <button
              key={stage}
              onClick={() => {
                setFilterStage(stage);
                setFilterVerdict("");
              }}
              className={`px-4 py-1.5 rounded-full text-sm ${
                filterStage === stage
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {stage}
            </button>
          )
        )}

        <select
          value={filterVerdict}
          onChange={(e) => {
            setFilterStage("OFFER");
            setFilterVerdict(e.target.value);
          }}
          className="px-4 py-2 rounded-full text-sm bg-gray-100 border"
        >
          <option value="">Offer outcome</option>
          <option value="ACCEPTED">Offer accepted</option>
          <option value="REJECTED">Offer declined</option>
          <option value="GHOSTED">No response</option>
        </select>
      </div>

      <div className="space-y-6">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className={`responsive-grid ${
              row.length === 1
                ? "grid-cols-1"
                : row.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            {row.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/tracker/${job.id}`)}
                className={`relative rounded-xl cursor-pointer shadow hover:shadow-xl transition ${getCardBg(
                  job
                )}`}
              >
                <button
                  onClick={(e) => deleteJob(job.id, e)}
                  className="absolute top-3 right-4 text-xs text-white/80"
                >
                  Delete
                </button>

                <div className="px-6 py-6 text-white">
                  <h3 className="font-semibold text-lg truncate">
                    {job.job_title}
                  </h3>
                  <p className="text-sm opacity-90">{job.company}</p>
                  <p className="text-xs opacity-75 mt-1">
                    Applied on {job.applied_date}
                  </p>
                  <p className="mt-4 text-xs underline opacity-90">
                    View details →
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showModal && (
        <AddJobModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchJobs();
          }}
        />
      )}
    </DashboardLayout>
  );
}
