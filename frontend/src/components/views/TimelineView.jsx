import {
  Clock3,
  ChevronRight,
} from "lucide-react";

import {
  STATUS_COLORS,
} from "../../utils/dashboardHelpers";


const STATUS_LABELS = {

  applied:
    "Applied",

  under_review:
    "Screening update",

  assessment:
    "Assessment update",

  interview:
    "Interview update",

  offer:
    "Offer update",

  rejected:
    "Application closed",

};


function formatDate(
  value
) {

  if (!value) {

    return "Recently";

  }


  const date =
    new Date(
      value
    );


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
  ).format(
    date
  );

}


function getStatusLabel(
  status
) {

  return (
    STATUS_LABELS[
      status
    ] ||
    "Application update"
  );

}


function getStatusColor(
  status
) {

  return (
    STATUS_COLORS?.[
      status
    ] ||
    "#7C8EA3"
  );

}


function getCompanyName(
  job
) {

  return (
    job.company_name ||
    job.company ||
    "Company not identified"
  );

}


function getRoleName(
  job
) {

  return (
    job.role_title ||
    job.job_title ||
    job.role ||
    "Role not identified"
  );

}


export default function TimelineView({
  jobs = [],
  onSelect,
}) {

  const safeJobs =
    Array.isArray(
      jobs
    )
      ? jobs
      : [];


  const timeline =
    [...safeJobs]
      .sort(
        (
          first,
          second
        ) => {

          const firstDate =
            new Date(
              first.last_email_at ||
              first.updated_at ||
              first.created_at ||
              0
            );


          const secondDate =
            new Date(
              second.last_email_at ||
              second.updated_at ||
              second.created_at ||
              0
            );


          return (
            secondDate -
            firstDate
          );

        }
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
            Follow the latest updates across your job search.
          </p>

        </div>

      </header>


      {
        timeline.length === 0
          ? (

            <div className="hl-empty-state">

              <div className="hl-empty-state-icon">

                <Clock3
                  size={28}
                />

              </div>


              <h2>
                No timeline updates yet
              </h2>


              <p>
                Application updates will appear here when HireLogix detects meaningful changes.
              </p>

            </div>

          )
          : (

            <div className="hl-full-timeline">

              {
                timeline.map(
                  (
                    job,
                    index
                  ) => {

                    const eventDate =
                      job.last_email_at ||
                      job.updated_at ||
                      job.created_at;


                    const status =
                      String(
                        job.status ||
                        "applied"
                      )
                        .toLowerCase()
                        .trim();


                    const statusColor =
                      getStatusColor(
                        status
                      );


                    return (

                      <button
                        key={
                          job.id ||
                          index
                        }
                        type="button"
                        className="hl-timeline-card"
                        onClick={
                          () =>
                            onSelect?.(
                              job.id
                            )
                        }
                      >

                        <div className="hl-timeline-date">

                          {
                            formatDate(
                              eventDate
                            )
                          }

                        </div>


                        <div className="hl-timeline-rail">

                          <span
                            className="hl-timeline-dot"
                            style={{
                              backgroundColor:
                                statusColor,
                            }}
                          />

                          {
                            index <
                            timeline.length - 1 && (

                              <span className="hl-timeline-line" />

                            )
                          }

                        </div>


                        <div className="hl-timeline-card-content">

                          <div className="hl-timeline-card-top">

                            <div className="hl-timeline-title-group">

                              <h3>

                                {
                                  getStatusLabel(
                                    status
                                  )
                                }

                              </h3>


                              <span
                                className="hl-status-pill"
                                style={{
                                  "--status-color":
                                    statusColor,
                                }}
                              >

                                <span />

                                {
                                  status
                                    .replace(
                                      /_/g,
                                      " "
                                    )
                                }

                              </span>

                            </div>


                            <ChevronRight
                              className="hl-timeline-arrow"
                              size={19}
                            />

                          </div>


                          <p className="hl-timeline-job">

                            <strong>

                              {
                                getCompanyName(
                                  job
                                )
                              }

                            </strong>


                            <span>
                              ·
                            </span>


                            {
                              getRoleName(
                                job
                              )
                            }

                          </p>


                          <p className="hl-timeline-description">

                            Latest application update detected by HireLogix.
                          </p>

                        </div>

                      </button>

                    );

                  }
                )
              }

            </div>

          )
      }

    </div>

  );

}