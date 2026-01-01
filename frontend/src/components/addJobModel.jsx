import { useState, useEffect } from "react";
import api from "../utils/api";

export default function AddJobModal({ onClose, onSuccess }) {
  const emptyForm = {
    company: "",
    job_title: "",
    applied_date: "",
    follow_up_date: "",
    max_salary: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(emptyForm);
    setResume(null);
    setError("");
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const submit = async () => {
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
      if (resume) data.append("resume", resume);

      await api.post("/jobs/", data);

      onClose();
      onSuccess();
    } catch (err) {
      setError("Failed to add job application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl mx-4 sm:mx-0 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Job Application</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <div className="space-y-5">
          <input
            name="company"
            value={form.company}
            placeholder="Company"
            className="input"
            onChange={handleChange}
            autoComplete="off"
          />

          <input
            name="job_title"
            value={form.job_title}
            placeholder="Job Title"
            className="input"
            onChange={handleChange}
            autoComplete="off"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="applied_date"
              value={form.applied_date}
              className="input"
              onChange={handleChange}
            />
            <input
              type="date"
              name="follow_up_date"
              value={form.follow_up_date}
              className="input"
              onChange={handleChange}
            />
          </div>

          <input
            type="number"
            name="max_salary"
            value={form.max_salary}
            placeholder="Max Salary (optional)"
            className="input"
            onChange={handleChange}
          />

          <textarea
            name="notes"
            value={form.notes}
            placeholder="Notes"
            className="input h-24"
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm mb-2">Resume Used</label>
            <label className="inline-flex items-center gap-3 px-5 py-2 bg-gray-200 rounded cursor-pointer">
              Upload Resume
              <input type="file" hidden onChange={(e) => setResume(e.target.files[0])} />
            </label>
            {resume && <p className="text-xs mt-2">{resume.name}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={submit} className="btn-primary" disabled={loading}>
            {loading ? "Adding..." : "Add Application"}
          </button>
        </div>
      </div>
    </div>
  );
}