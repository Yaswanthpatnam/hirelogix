import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Sparkles,
  Target,
} from "lucide-react";

import {
  calculateRate,
} from "../../utils/dashboardHelpers";


export default function InsightsView({
  summary,
  jobs = [],
}) {
  const total =
    Number(
      summary?.historical?.total_applications ??
      summary?.total ??
      jobs.length ??
      0
    );

  const historical =
    summary?.historical || {};

  const responded =
    Number(
      historical.response_count || 0
    );

  const interviews =
    Number(
      historical.ever_interview || 0
    );

  const offers =
    Number(
      historical.ever_offer || 0
    );

  const assessment =
    Number(
      historical.ever_assessment || 0
    );

  const screening =
    Number(
      historical.ever_under_review || 0
    );

  const rejected =
    Number(
      historical.ever_rejected || 0
    );


  const responseRate =
    calculateRate(
      responded,
      total
    );

  const interviewRate =
    calculateRate(
      interviews,
      total
    );

  const offerRate =
    calculateRate(
      offers,
      total
    );


  const strongestStage =
    [
      {
        label: "Screening",
        value: screening,
      },
      {
        label: "Assessment",
        value: assessment,
      },
      {
        label: "Interview",
        value: interviews,
      },
      {
        label: "Offer",
        value: offers,
      },
    ]
      .sort(
        (
          first,
          second
        ) =>
          second.value -
          first.value
      )[0];


  return (
    <div className="hl-page-view">

      <header className="hl-view-header">
        <div>

          <span className="hl-eyebrow">
            JOB SEARCH ANALYTICS
          </span>

          <h1>
            Insights
          </h1>

          <p>
            A practical view of how your applications are progressing.
          </p>

        </div>
      </header>


      <div className="hl-insights-grid">

        <article className="hl-insight-card">
          <ChartNoAxesCombined size={22} />

          <span>
            Response rate
          </span>

          <strong>
            {responseRate}%
          </strong>

          <p>
            Applications that received a meaningful response after submission.
          </p>
        </article>


        <article className="hl-insight-card">
          <Target size={22} />

          <span>
            Interview rate
          </span>

          <strong>
            {interviewRate}%
          </strong>

          <p>
            Applications that reached an interview at any point.
          </p>
        </article>


        <article className="hl-insight-card">
          <Sparkles size={22} />

          <span>
            Offer rate
          </span>

          <strong>
            {offerRate}%
          </strong>

          <p>
            Applications that reached an offer stage.
          </p>
        </article>


        <article className="hl-insight-card">
          <BriefcaseBusiness size={22} />

          <span>
            Applications tracked
          </span>

          <strong>
            {total}
          </strong>

          <p>
            Applications identified from your tracked job-search activity.
          </p>
        </article>

      </div>


      <section className="hl-panel hl-insight-summary">

        <div className="hl-insight-summary-icon">
          <Sparkles size={22} />
        </div>


        <div>

          <h2>
            What your data is saying
          </h2>

          <p>
            {total === 0
              ? "Start applying and HireLogix will build useful insights as your job-search activity grows."
              : strongestStage?.value > 0
                ? `${strongestStage.value} application${strongestStage.value === 1 ? "" : "s"} reached the ${strongestStage.label.toLowerCase()} stage.`
                : "Your dashboard will become more insightful as more application updates arrive."}
          </p>

        </div>

      </section>

    </div>
  );
}