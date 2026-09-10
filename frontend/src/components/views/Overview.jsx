import {
  useMemo,
} from "react";

import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import StatCard from
  "../dashboard/StatCard";

import SectionHeading from
  "../dashboard/SectionHeading";

import StatusBadge from
  "../dashboard/StatusBadge";

import DonutChart from
  "../charts/DonutChart";

import ActivityChart from
  "../charts/ActivityChart";

import {
  STATUS_COLORS,
  calculateRate,
  getCompanyColor,
  getInitials,
  getUserFirstName,
} from "../../utils/dashboardHelpers";


const STATUS_ORDER = [
  "applied",
  "under_review",
  "assessment",
  "interview",
  "offer",
  "rejected",
];


const STATUS_LABELS = {
  applied:
    "Applied",

  under_review:
    "Screening",

  assessment:
    "Assessment",

  interview:
    "Interview",

  offer:
    "Offer",

  rejected:
    "Rejected",
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


export default function Overview({
  summary,
  jobs,
  user,
  onSelect,
  onApplications,
}) {

  const safeJobs =
    Array.isArray(
      jobs
    )
      ? jobs
      : [];


  const firstName =
    getUserFirstName(
      user
    );


  /*
   * =========================================================
   * CURRENT PIPELINE COUNTS
   * =========================================================
   *
   * These come directly from the Summary API.
   *
   * The Summary API is the source of truth for the current
   * JobApplication state.
   */
  const total =
    Number(
      summary?.total ??
      safeJobs.length ??
      0
    );


  const interviews =
    Number(
      summary?.interview ||
      0
    );


  const offers =
    Number(
      summary?.offer ||
      0
    );


  const rejected =
    Number(
      summary?.rejected ||
      0
    );


  const assessment =
    Number(
      summary?.assessment ||
      0
    );


  const screening =
    Number(
      summary?.under_review ||
      0
    );


  /*
   * =========================================================
   * PIPELINE DISTRIBUTION
   * =========================================================
   */
  const distribution =
    useMemo(
      () =>
        STATUS_ORDER.map(
          (status) => ({
            status,

            name:
              STATUS_LABELS[
                status
              ],

            value:
              Number(
                summary?.[
                  status
                ] || 0
              ),

            color:
              STATUS_COLORS[
                status
              ],
          })
        ),

      [
        summary,
      ]
    );


  /*
   * =========================================================
   * APPLICATION ACTIVITY
   * =========================================================
   *
   * IMPORTANT:
   *
   * Do NOT calculate this from:
   *
   *   job.last_email_at
   *   job.updated_at
   *   job.created_at
   *
   * because those represent the application's latest/current
   * database state and can therefore be an interview,
   * assessment, rejection, etc.
   *
   * The backend Summary API now calculates activity from
   * actual APPLIED Gmail events.
   */
  const activityData =
    useMemo(
      () => {
        const activity =
          summary?.activity;

        return Array.isArray(
          activity
        )
          ? activity
          : [];
      },

      [
        summary,
      ]
    );


  /*
   * =========================================================
   * APPLICATION TIMELINE
   * =========================================================
   *
   * The backend now provides timeline events based on
   * GmailJobEmail history instead of making the frontend
   * guess from JobApplication.last_email_at.
   */
  const timelineJobs =
    useMemo(
      () => {
        const timeline =
          summary?.timeline;

        return Array.isArray(
          timeline
        )
          ? timeline
          : [];
      },

      [
        summary,
      ]
    );


  /*
   * =========================================================
   * CURRENT-STATE RESPONSE COUNT
   * =========================================================
   *
   * Kept for the existing Overview UI.
   *
   * Insights uses the historical metrics returned by the
   * Summary API.
   */
  const responded =
    screening +
    assessment +
    interviews +
    offers +
    rejected;


  return (
    <div className="hl-overview">

      {/* =====================================================
          OVERVIEW HEADER
      ====================================================== */}

      <header className="hl-overview-header">

        <div>

          <span className="hl-eyebrow">
            JOB SEARCH WORKSPACE
          </span>

          <h1>
            Good morning,{" "}
            {firstName}
          </h1>

          <p>
            Here's how your job search is moving.
          </p>

        </div>


        <button
          className="hl-outline-action"
          onClick={
            onApplications
          }
        >

          <CalendarDays
            size={18}
          />

          View applications

          <ChevronRight
            size={17}
          />

        </button>

      </header>


      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="stats-grid">

        <StatCard
          label="Total applications"
          value={total}
          context="Applications currently tracked"
          icon={
            BriefcaseBusiness
          }
        />


        <StatCard
          label="Interviews"
          value={interviews}
          context={
            `${calculateRate(
              interviews,
              total
            )}% interview rate`
          }
          icon={
            CalendarDays
          }
          tone="success"
        />


        <StatCard
          label="Offers"
          value={offers}
          context={
            `${calculateRate(
              offers,
              total
            )}% offer rate`
          }
          icon={
            Sparkles
          }
          tone="warning"
        />


        <StatCard
          label="Rejected"
          value={rejected}
          context={
            `${calculateRate(
              rejected,
              total
            )}% of applications`
          }
          icon={
            TrendingUp
          }
        />

      </div>


      {/* =====================================================
          PIPELINE + SEARCH INSIGHTS
      ====================================================== */}

      <div className="hl-overview-grid">

        {/* ---------------------------------------------------
            APPLICATION PIPELINE
        ---------------------------------------------------- */}

        <section className="hl-panel">

          <SectionHeading
            title="Application pipeline"
            description="Where your applications currently stand."
          />


          <div className="hl-pipeline-content">

            <DonutChart
              data={
                distribution
              }
            />


            <div className="hl-pipeline-legend">

              {
                distribution.map(
                  (item) => (

                    <div
                      className="hl-pipeline-row"
                      key={
                        item.status
                      }
                    >

                      <div>

                        <span
                          className="hl-status-dot"
                          style={{
                            background:
                              item.color,
                          }}
                        />

                        <span>
                          {item.name}
                        </span>

                      </div>


                      <strong>
                        {item.value}
                      </strong>

                    </div>

                  )
                )
              }

            </div>

          </div>

        </section>


        {/* ---------------------------------------------------
            SEARCH INSIGHTS
        ---------------------------------------------------- */}

        <section className="hl-panel">

          <SectionHeading
            title="Your search, at a glance"
            description="A clearer view of your current progress."
          />


          <div className="hl-insight-grid">

            <div>

              <span>
                Response rate
              </span>

              <strong>

                {
                  calculateRate(
                    responded,
                    total
                  )
                }

                %

              </strong>

            </div>


            <div>

              <span>
                Interview rate
              </span>

              <strong>

                {
                  calculateRate(
                    interviews,
                    total
                  )
                }

                %

              </strong>

            </div>


            <div>

              <span>
                Assessment stage
              </span>

              <strong>
                {assessment}
              </strong>

            </div>


            <div>

              <span>
                Screening
              </span>

              <strong>
                {screening}
              </strong>

            </div>

          </div>


          <div className="hl-insight-callout">

            <Sparkles
              size={18}
            />

            <p>

              {
                interviews > 0
                  ? `${interviews} application${
                      interviews === 1
                        ? ""
                        : "s"
                    } currently ${
                      interviews === 1
                        ? "has"
                        : "have"
                    } an interview update.`
                  : "More application activity will make your insights increasingly useful."
              }

            </p>

          </div>

        </section>

      </div>


      {/* =====================================================
          ACTIVITY + TIMELINE
      ====================================================== */}

      <div className="hl-overview-grid hl-activity-timeline-grid">

        {/* ---------------------------------------------------
            APPLICATION ACTIVITY
        ---------------------------------------------------- */}

        <section className="hl-panel">

          <SectionHeading
            title="Application activity"
            description="Applications submitted over the last seven days."
          />


          <ActivityChart
            data={
              activityData
            }
          />

        </section>


        {/* ---------------------------------------------------
            APPLICATION TIMELINE
        ---------------------------------------------------- */}

        <section className="hl-panel">

          <SectionHeading
            title="Application timeline"
            description="The latest meaningful movement across your job search."
          />


          <div className="hl-mini-timeline">

            {
              timelineJobs.map(
                (job, index) => {

                  /*
                   * IMPORTANT:
                   *
                   * Timeline objects from the Summary API use
                   * event_date.
                   *
                   * Do not use last_email_at here.
                   */
                  const date =
                    job.event_date ||
                    job.last_email_at ||
                    job.updated_at ||
                    job.created_at;


                  return (

                    <button
                      key={
                        job.job_id ||
                        job.id ||
                        index
                      }
                      className="hl-mini-timeline-item"
                      onClick={
                        () =>
                          onSelect?.(
                            job.job_id ||
                            job.id
                          )
                      }
                    >

                      <span
                        className="hl-timeline-dot"
                        style={{
                          background:
                            STATUS_COLORS[
                              job.status
                            ] ||
                            "#7C8EA3",
                        }}
                      />


                      <div className="hl-mini-timeline-info">

                        <strong>

                          {
                            STATUS_LABELS[
                              job.status
                            ] ||
                            job.status_display ||
                            "Application update"
                          }

                        </strong>


                        <span className="hl-mini-timeline-company">

                          {
                            job.company_name ||
                            "Company not identified"
                          }

                        </span>


                        <span className="hl-mini-timeline-role">

                          {
                            job.role_title ||
                            "Role not identified"
                          }

                        </span>

                      </div>


                      <time>
                        {
                          formatDate(
                            date
                          )
                        }
                      </time>

                    </button>

                  );

                }
              )
            }


            {
              timelineJobs.length === 0 && (

                <p className="hl-empty-copy">
                  Application updates will appear here.
                </p>

              )
            }

          </div>

        </section>

      </div>


      {/* =====================================================
          RECENT APPLICATIONS
      ====================================================== */}

      <section className="hl-panel">

        <SectionHeading
          title="Recent applications"
          description="Your most recently updated applications."
          action={

            <button
              className="hl-text-action"
              onClick={
                onApplications
              }
            >

              View all

              <ChevronRight
                size={16}
              />

            </button>

          }
        />


        <div className="hl-recent-list">

          {
            safeJobs
              .slice(
                0,
                5
              )
              .map(
                (job) => (

                  <button
                    className="hl-recent-row"
                    key={
                      job.id
                    }
                    onClick={
                      () =>
                        onSelect?.(
                          job.id
                        )
                    }
                  >

                    <span
                      className="hl-company-avatar"
                      style={{
                        background:
                          getCompanyColor(
                            job.company_name ||
                            ""
                          ),
                      }}
                    >

                      {
                        getInitials(
                          job.company_name ||
                          "?"
                        )
                      }

                    </span>


                    <strong className="hl-recent-company">

                      {
                        job.company_name ||
                        "Company not identified"
                      }

                    </strong>


                    <span className="hl-recent-role">

                      {
                        job.role_title ||
                        "Role not identified"
                      }

                    </span>


                    <StatusBadge
                      status={
                        job.status ||
                        "applied"
                      }
                    />


                    <ChevronRight
                      size={18}
                    />

                  </button>

                )
              )
          }

        </div>

      </section>

    </div>
  );
}