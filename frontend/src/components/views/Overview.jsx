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
  buildActivityData,
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


function buildTimeline(
  jobs
) {

  const safeJobs =
    Array.isArray(
      jobs
    )
      ? jobs
      : [];


  return (
    [...safeJobs]
      .filter(
        (job) =>
          job &&
          (
            job.last_email_at ||
            job.updated_at ||
            job.created_at
          )
      )
      .sort(
        (
          first,
          second
        ) => {

          const firstDate =
            new Date(
              first.last_email_at ||
              first.updated_at ||
              first.created_at
            );


          const secondDate =
            new Date(
              second.last_email_at ||
              second.updated_at ||
              second.created_at
            );


          return (
            secondDate -
            firstDate
          );

        }
      )
      .slice(
        0,
        4
      )
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


  const activityData =
    useMemo(
      () =>
        buildActivityData(
          safeJobs
        ),

      [
        safeJobs,
      ]
    );


  const timelineJobs =
    useMemo(
      () =>
        buildTimeline(
          safeJobs
        ),

      [
        safeJobs,
      ]
    );


  const responded =
    screening +
    assessment +
    interviews +
    offers +
    rejected;


  return (

    <div className="hl-overview">

      <header className="hl-overview-header">

        <div>

          <span className="hl-eyebrow">
            JOB SEARCH WORKSPACE
          </span>

          <h1>
            Good morning,{" "}
            {firstName}.
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


      <div className="hl-overview-grid">

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


      <div className="hl-overview-grid">

        <section className="hl-panel">

          <SectionHeading
            title="Application activity"
            description="Recent application activity over the last seven days."
          />


          <ActivityChart
            data={
              activityData
            }
          />

        </section>


        <section className="hl-panel">

          <SectionHeading
            title="Application timeline"
            description="The latest movement across your job search."
          />


          <div className="hl-mini-timeline">

            {
              timelineJobs.map(
                (job) => {

                  const date =
                    job.last_email_at ||
                    job.updated_at ||
                    job.created_at;


                  return (

                    <button
                      key={
                        job.id
                      }
                      className="hl-mini-timeline-item"
                      onClick={
                        () =>
                          onSelect?.(
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


                      <div>

                        <strong>

                          {
                            STATUS_LABELS[
                              job.status
                            ] ||
                            "Application update"
                          }

                        </strong>

                        <span>

                          {
                            job.company_name ||
                            "Company not identified"
                          }

                          {" · "}

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


                    <div>

                      <strong>

                        {
                          job.company_name ||
                          "Company not identified"
                        }

                      </strong>

                      <span>

                        {
                          job.role_title ||
                          "Role not identified"
                        }

                      </span>

                    </div>


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