import {
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";


export default function EmptyDashboard({
  onApplications,
}) {

  return (

    <section className="empty-dashboard">

      <div className="empty-dashboard-icon">

        <BriefcaseBusiness
          size={32}
        />

      </div>


      <span className="empty-dashboard-eyebrow">

        YOUR JOB SEARCH STARTS HERE

      </span>


      <h1>

        Nothing to track
        <br />

        <em>yet.</em>

      </h1>


      <p>

        Connect your Gmail and HireLogix will
        start identifying job application emails
        and tracking meaningful updates.

      </p>


      <button
        type="button"
        className="primary-button"
        onClick={
          onApplications
        }
      >

        View applications

        <ArrowRight
          size={18}
        />

      </button>


      <span className="empty-dashboard-note">

        Your dashboard updates automatically
        when applications are detected.

      </span>

    </section>

  );

}