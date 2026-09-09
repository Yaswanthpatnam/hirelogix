export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">

      <div className="skeleton-heading">

        <div className="skeleton skeleton-eyebrow" />

        <div className="skeleton skeleton-title" />

        <div className="skeleton skeleton-description" />

      </div>


      <div className="skeleton-stats">

        {
          Array.from(
            { length: 4 }
          ).map(
            (_, index) => (

              <div
                className="skeleton-card"
                key={index}
              >

                <div className="skeleton skeleton-small" />

                <div className="skeleton skeleton-number" />

                <div className="skeleton skeleton-small" />

              </div>

            )
          )
        }

      </div>


      <div className="skeleton-grid">

        <div className="skeleton-panel" />

        <div className="skeleton-panel" />

      </div>


      <div className="skeleton-panel skeleton-large" />

    </div>
  );
}