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
    await fetchJobs();

    // 🔥 Notify dashboard
    window.dispatchEvent(new Event("jobs-updated"));
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
      <div className="flex justify-between mb-10">
        <h1 className="text-2xl font-semibold">
          Let’s review your opportunities,{" "}
          <span className="text-purple-600">{username}</span>
        </h1>

        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add Job
        </button>
      </div>

      <div className="space-y-6">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-6">
            {row.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/tracker/${job.id}`)}
                className={`rounded-xl cursor-pointer shadow hover:shadow-xl transition ${getCardBg(job)}`}
              >
                <button
                  onClick={(e) => deleteJob(job.id, e)}
                  className="absolute top-3 right-4 text-xs text-white/80"
                >
                  Delete
                </button>

                <div className="p-6 text-white">
                  <h3 className="font-semibold text-lg">
                    {job.job_title}
                  </h3>
                  <p className="text-sm">{job.company}</p>
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
            window.dispatchEvent(new Event("jobs-updated")); 
          }}
        />
      )}
    </DashboardLayout>
  );
}
