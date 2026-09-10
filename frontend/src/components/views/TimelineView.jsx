import {
  Clock3,
} from "lucide-react";

import {
  STATUS_COLORS,
} from "../../utils/dashboardHelpers";


const STATUS_LABELS = {
  applied: "Applied",
  under_review: "Screening update",
  assessment: "Assessment update",
  interview: "Interview update",
  offer: "Offer update",
  rejected: "Application closed",
};


function formatDate(
  value
) {
  if (!value) {
    return "Recently";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}


export default function TimelineView({
  jobs = [],
  timeline = [],
  onSelect,
}) {
  const safeTimeline =
    Array.isArray(timeline)
      ? timeline
      : [];

  const fallbackJobs =
    Array.isArray(jobs)
      ? jobs
      : [];

  const events =
    safeTimeline.length > 0
      ? safeTimeline
      : fallbackJobs.map(
          (job) => ({
            job_id: job.id,
            company_name:
              job.company_name,
            role_title:
              job.role_title,
            status:
              job.status,
            status_display:
              job.status_display,
            event_date:
              job.last_email_at ||
              job.updated_at ||
              job.created_at,
          })
        );


  return (
    <div className="hl-page-view hl-timeline-view">

      <header className="hl-view-header">
        <div>
          <span className="hl-eyebrow">
            APPLICATION HISTORY
          </span>

          <h1>
            Application timeline
          </h1>

          <p>
            Follow the latest meaningful updates across your job search.
          </p>
        </div>
      </header>


      {events.length === 0 ? (
        <div className="hl-empty-state">

          <div className="hl-empty-state-icon">
            <Clock3 size={28} />
          </div>

          <h2>
            No timeline updates yet
          </h2>

          <p>
            Application updates will appear here when HireLogix detects meaningful changes.
          </p>

        </div>
      ) : (

        <div className="hl-full-timeline">

          {events.map(
            (
              event,
              index
            ) => {

              const status =
                String(
                  event.status ||
                  "applied"
                )
                  .toLowerCase()
                  .trim();

              const statusColor =
                STATUS_COLORS[
                  status
                ] || "#7C8EA3";

              return (
                <button
                  key={
                    event.job_id ||
                    index
                  }
                  type="button"
                  className="hl-timeline-card"
                  onClick={() =>
                    onSelect?.(
                      event.job_id
                    )
                  }
                >

                  <div className="hl-timeline-date">
                    {formatDate(
                      event.event_date
                    )}
                  </div>


                  <div className="hl-timeline-rail">

                    <span
                      className="hl-timeline-dot"
                      style={{
                        backgroundColor:
                          statusColor,
                      }}
                    />

                    {index <
                      events.length - 1 && (
                      <span className="hl-timeline-line" />
                    )}

                  </div>


                  <div className="hl-timeline-copy">

                    <div>
                      <strong>
                        {STATUS_LABELS[
                          status
                        ] ||
                          event.status_display ||
                          "Application update"}
                      </strong>
                    </div>


                    <span>
                      {event.company_name ||
                        "Company not identified"}

                      {event.role_title
                        ? ` · ${event.role_title}`
                        : ""}
                    </span>


                    {event.subject && (
                      <p>
                        {event.subject}
                      </p>
                    )}

                  </div>

                </button>
              );
            }
          )}

        </div>

      )}

    </div>
  );
}