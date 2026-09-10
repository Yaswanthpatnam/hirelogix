import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  MapPin,
  X,
  Loader2,
} from "lucide-react";

import { getJobById } from "../../services/jobs";

import {
  formatDate,
  getStatusLabel,
} from "../../utils/jobHelpers";

export default function DetailPanel({
  jobId,
  onClose,
}) {
  const [job, setJob] = useState(null);

  const [loading, setLoading] = useState(true);

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
                    {job.role_title}
                  </p>
                </div>
              </section>

              {/* STATUS */}
              <section className="detail-meta-grid">
                <div className="detail-meta-card">
                  <span>
                    Current status
                  </span>

                  <strong
                    className={
                      `status-badge status-${job.status}`
                    }
                  >
                    {
                      getStatusLabel(
                        job.status
                      )
                    }
                  </strong>
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
                      <span>
                        Company
                      </span>

                      <strong>
                        {job.company_name}
                      </strong>
                    </div>
                  </div>

                  <div className="detail-info-row">
                    <Calendar size={17} />

                    <div>
                      <span>
                        Last activity
                      </span>

                      <strong>
                        {
                          formatDate(
                            job.last_email_at
                          )
                        }
                      </strong>
                    </div>
                  </div>

                  {
                    job.location && (
                      <div className="detail-info-row">
                        <MapPin size={17} />

                        <div>
                          <span>
                            Location
                          </span>

                          <strong>
                            {job.location}
                          </strong>
                        </div>
                      </div>
                    )
                  }
                </div>
              </section>

              {/* JOURNEY */}
              <section className="detail-section">
                <h2>
                  Application journey
                </h2>

                <ApplicationJourney
                  status={job.status}
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
              index <= activeIndex;

            return (
              <div
                className={
                  `application-journey-step ${
                    completed
                      ? "completed"
                      : ""
                  }`
                }
                key={step.id}
              >
                <div className="journey-marker">
                  {
                    completed
                      ? "✓"
                      : index + 1
                  }
                </div>

                <span>
                  {step.label}
                </span>
              </div>
            );
          }
        )
      }
    </div>
  );
}
