export default function StatCard({
  label,
  value,
  context,
  icon: Icon,
  tone = "",
}) {
  return (
    <article
      className={
        `stat-card ${tone}`
      }
    >

      <div className="stat-card-top">

        <span>
          {label}
        </span>

        <Icon size={16} />

      </div>

      <strong>
        {value}
      </strong>

      <p>
        {context}
      </p>

    </article>
  );
}