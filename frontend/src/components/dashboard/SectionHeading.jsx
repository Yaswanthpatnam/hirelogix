export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="section-heading">

      <div>

        {
          eyebrow && (
            <p className="section-eyebrow">
              {eyebrow}
            </p>
          )
        }

        <h2>
          {title}
        </h2>

        {
          description && (
            <p>
              {description}
            </p>
          )
        }

      </div>

      {action}

    </div>
  );
}