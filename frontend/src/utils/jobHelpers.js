export function getStatusLabel(
  status
) {

  const labels = {

    applied:
      "Applied",

    under_review:
      "Screening",

    interview:
      "Interview",

    assessment:
      "Assessment",

    offer:
      "Offer",

    rejected:
      "Rejected",

  };


  return (
    labels[status]
    || status
  );

}


export function formatDate(
  value
) {

  if (!value) {

    return "—";

  }


  const date =
    new Date(value);


  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",
    }
  ).format(
    date
  );

}