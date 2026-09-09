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
      summary?.total ||
      jobs.length ||
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


  const screening =
    Number(
      summary?.under_review ||
      0
    );


  const assessment =
    Number(
      summary?.assessment ||
      0
    );


  const rejected =
    Number(
      summary?.rejected ||
      0
    );


  const responded =
    screening +
    assessment +
    interviews +
    offers +
    rejected;


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
        label:
          "Screening",
        value:
          screening,
      },

      {
        label:
          "Assessment",
        value:
          assessment,
      },

      {
        label:
          "Interview",
        value:
          interviews,
      },

      {
        label:
          "Offer",
        value:
          offers,
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

          <ChartNoAxesCombined
            size={22}
          />

          <span>
            Response rate
          </span>

          <strong>

            {responseRate}%

          </strong>

          <p>
            Applications that moved beyond the initial stage.
          </p>

        </article>


        <article className="hl-insight-card">

          <Target
            size={22}
          />

          <span>
            Interview rate
          </span>

          <strong>

            {interviewRate}%

          </strong>

          <p>
            Applications that currently reached interview stage.
          </p>

        </article>


        <article className="hl-insight-card">

          <Sparkles
            size={22}
          />

          <span>
            Offer rate
          </span>

          <strong>

            {offerRate}%

          </strong>

          <p>
            Offers relative to your tracked applications.
          </p>

        </article>


        <article className="hl-insight-card">

          <BriefcaseBusiness
            size={22}
          />

          <span>
            Applications tracked
          </span>

          <strong>

            {total}

          </strong>

          <p>
            Total applications currently available in HireLogix.
          </p>

        </article>

      </div>


      <section className="hl-panel hl-insight-summary">

        <div className="hl-insight-summary-icon">

          <Sparkles
            size={22}
          />

        </div>


        <div>

          <h2>
            What your data is saying
          </h2>

          <p>

            {
              total === 0
                ? "Start applying and HireLogix will build useful insights as your job-search activity grows."
                : strongestStage?.value > 0
                  ? `Most of your current application activity is in the ${strongestStage.label.toLowerCase()} stage.`
                  : "Your applications are still in their early stages. More recruiter updates will create clearer insights."
            }

          </p>

        </div>

      </section>


      <section className="hl-panel">

        <h2 className="hl-section-title">
          Current distribution
        </h2>


        <div className="hl-distribution-list">

          {
            [
              [
                "Screening",
                screening,
              ],

              [
                "Assessment",
                assessment,
              ],

              [
                "Interview",
                interviews,
              ],

              [
                "Offer",
                offers,
              ],

              [
                "Rejected",
                rejected,
              ],
            ].map(
              (
                [
                  label,
                  value,
                ]
              ) => (

                <div
                  key={label}
                  className="hl-distribution-row"
                >

                  <span>
                    {label}
                  </span>

                  <div>

                    <i
                      style={{
                        width:
                          `${calculateRate(
                            value,
                            total
                          )}%`,
                      }}
                    />

                  </div>

                  <strong>
                    {value}
                  </strong>

                </div>

              )
            )
          }

        </div>

      </section>

    </div>

  );

}