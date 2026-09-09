import {
  getStatusLabel,
} from "../../utils/jobHelpers";


export default function StatusBadge({
  status,
}) {
  const normalizedStatus =
    (status || "")
      .toLowerCase()
      .replace(
        /\s+/g,
        "_"
      );

  return (
    <span
      className={
        `status-badge status-${normalizedStatus}`
      }
    >
      <i />

      {
        getStatusLabel(
          normalizedStatus
        )
      }
    </span>
  );
}