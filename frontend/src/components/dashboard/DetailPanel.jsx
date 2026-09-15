import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  MapPin,
  X,
  Loader2,
} from "lucide-react";

import {
  getJobById,
  updateJobApplication,
} from "../../services/jobs";

import {
  formatDate,
  getStatusLabel,
} from "../../utils/jobHelpers";

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Screening" },
  { value: "assessment", label: "Assessment" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

export default function DetailPanel({
  jobId,
  onClose,
  onJobUpdated,
}) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => {
      let active = true;

      const loadJob = async () => {
        try {
          setLoading(true);
          setError("");

          const data = await getJobById(jobId);

          if (active) {
            setJob(data);
          }
        } catch (err) {
          console.error(
            "Failed to load job:",
            err
          );

          if (active) {
            setError(
              "Unable to load application details."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      loadJob();

      return () => {
        active = false;
      };
    },
    [jobId]
  );

  const handleStatusChange = async (newStatus) => {
    if (!job || job.status === newStatus || updating) {
      return;
    }

    const previousStatus = job.status;
    const updatedJob = {
      ...job,
      status: newStatus,
    };

    setJob(updatedJob);
    setUpdating(true);

    try {
      const savedJob = await updateJobApplication(
        job.id,
        { status: newStatus }
      );

      const finalJob = savedJob || updatedJob;
      setJob(finalJob);
      onJobUpdated?.(finalJob);
    } catch (err) {
      console.error(
        "Failed to update status:",
        err
      );
      setJob((prev) => ({
        ...prev,
        status: previousStatus,
      }));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className="detail-backdrop"
        onClick={onClose}
      />

      {/* PANEL */}
      <aside className="detail-panel">
        {/* HEADER */}
        <div className="detail-header">
          <button
            className="detail-close"
            onClick={onClose}
            aria-label="Close application details"
          >
            <X size={20} />
          </button>
        </div>

        {/* LOADING */}
        {
          loading && (
            <div className="detail-loading">
              <Loader2
                size={24}
                className="spin"
              />
            </div>
          )
        }

        {/* ERROR */}
        {
          !loading &&
          error && (
            <div className="detail-error">
              <h3>
                Something went wrong
              </h3>

              <p>
                {error}
              </p>
            </div>
          )
        }

        {/* CONTENT */}
        {
          !loading &&
          !error &&
          job && (
            <div className="detail-content">
              {/* COMPANY */}
              <section className="detail-company">
                <div className="detail-company-icon">
                  {
                    job.company_name
                      ?.charAt(0)
                      ?.toUpperCase()
                  }
                </div>

                <div className="detail-company-copy">
                  <span className="detail-label">
                    APPLICATION DETAILS
                  </span>

                  <h1>
                    {job.company_name}
                  </h1>

                  <p>
                    {job.role_title || "Role not specified"}
                  </p>
                </div>
              </section>

              {/* STATUS & META */}
              <section className="detail-meta-grid">
                <div className="detail-meta-card">
                  <span>
                    Current status
                  </span>

                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updating}
                      className={`status-badge status-${job.status}`}
                      style={{
                        cursor: "pointer",
                        appearance: "none",
                        paddingRight: "22px",
                        background: "transparent",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 650,
                        outline: "none",
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          style={{ background: "#181222", color: "#fff" }}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {updating ? (
                      <Loader2 size={12} className="spin" style={{ position: "absolute", right: "4px" }} />
                    ) : (
                      <ChevronDown size={13} style={{ position: "absolute", right: "4px", pointerEvents: "none", opacity: 0.8 }} />
                    )}
                  </div>
                </div>

                <div className="detail-meta-card">
                  <span>
                    Added
                  </span>

                  <strong>
                    {
                      formatDate(
                        job.created_at
                      )
                    }
                  </strong>
                </div>

                <div className="detail-meta-card">
                  <span>
                    Source
                  </span>

                  <strong>
                    {
                      job.source_display ||
                      job.source ||
                      "—"
                    }
                  </strong>
                </div>
              </section>

              {/* DETAILS */}
              <section className="detail-section">
                <h2>
                  Application details
                </h2>

                <div className="detail-info-list">
                  <div className="detail-info-row">
                    <Building2 size={17} />
                    <div>
                      <span>Company</span>
                      <strong>{job.company_name}</strong>
                    </div>
                  </div>

                  <div className="detail-info-row">
                    <Calendar size={17} />
                    <div>
                      <span>Last activity</span>
                      <strong>
                        {formatDate(job.last_email_at || job.updated_at)}
                      </strong>
                    </div>
                  </div>

                  {job.interview_link && (
                    <div className="detail-info-row" style={{ alignItems: "flex-start" }}>
                      <Calendar size={17} style={{ color: "#8b5cf6" }} />
                      <div>
                        <span>Interview Link</span>
                        <a
                          href={job.interview_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#c084fc",
                            textDecoration: "underline",
                            wordBreak: "break-all",
                            fontSize: "13px",
                            display: "inline-block",
                            marginTop: "3px",
                          }}
                        >
                          Join Video Call / Interview ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {job.location_text && (
                    <div className="detail-info-row">
                      <MapPin size={17} />
                      <div>
                        <span>Location</span>
                        <strong>{job.location_text}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </section>


              {/* JOURNEY */}
              <section className="detail-section">
                <h2>
                  Application journey
                </h2>

                <ApplicationJourney
                  status={job.status}
                  onSelectStatus={handleStatusChange}
                  updating={updating}
                />
              </section>
            </div>
          )
        }
      </aside>
    </>
  );
}

function ApplicationJourney({
  status,
  onSelectStatus,
  updating,
}) {
  const steps = [
    {
      id: "applied",
      label: "Applied",
    },
    {
      id: "under_review",
      label: "Screening",
    },
    {
      id: "assessment",
      label: "Assessment",
    },
    {
      id: "interview",
      label: "Interview",
    },
    {
      id: "offer",
      label: "Offer",
    },
  ];

  const activeIndex = steps.findIndex(
    (step) => step.id === status
  );

  return (
    <div className="application-journey">
      {
        steps.map(
          (
            step,
            index
          ) => {
            const completed =
              index <= activeIndex && status !== "rejected";

            const isCurrent = step.id === status;

            return (
              <button
                type="button"
                className={
                  `application-journey-step ${
                    completed
                      ? "completed"
                      : ""
                  } ${isCurrent ? "current" : ""}`
                }
                key={step.id}
                onClick={() => onSelectStatus?.(step.id)}
                disabled={updating}
                style={{
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "4px 0",
                  font: "inherit",
                }}
              >
                <div className="journey-marker">
                  {
                    completed
                      ? "✓"
                      : index + 1
                  }
                </div>

                <span style={{ fontWeight: isCurrent ? 700 : 500 }}>
                  {step.label}
                  {isCurrent && " (Current)"}
                </span>
              </button>
            );
          }
        )
      }

      {status === "rejected" && (
        <div
          className="application-journey-step"
          style={{ padding: "4px 0", opacity: 0.9 }}
        >
          <div
            className="journey-marker"
            style={{
              borderColor: "var(--status-rejected, #A65A5A)",
              color: "var(--status-rejected, #A65A5A)",
            }}
          >
            ✕
          </div>
          <span style={{ color: "#d17b86", fontWeight: 650 }}>
            Application Closed / Rejected
          </span>
        </div>
      )}
    </div>
  );
}
