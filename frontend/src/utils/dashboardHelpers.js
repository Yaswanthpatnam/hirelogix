export const STATUS_COLORS = {
  applied: "#6E7A89",

  under_review: "#B58A42",

  assessment: "#7B61FF",

  interview: "#4F8A70",

  offer: "#D49A3A",

  rejected: "#A65A5A",
};


export function calculateRate(
  value,
  total
) {

  const safeTotal =
    Number(
      total || 0
    );


  if (
    safeTotal <= 0
  ) {

    return 0;

  }


  return Math.round(
    (
      Number(
        value || 0
      ) /
      safeTotal
    ) * 100
  );

}


export function getInitials(
  value
) {

  const safeValue =
    String(
      value || ""
    ).trim();


  if (!safeValue) {

    return "U";

  }


  return safeValue
    .split(
      /\s+/
    )
    .filter(
      Boolean
    )
    .slice(
      0,
      2
    )
    .map(
      (word) =>
        word.charAt(
          0
        )
    )
    .join(
      ""
    )
    .toUpperCase();

}


export function getUserDisplayName(
  user
) {

  const safeUser =
    user?.user &&
    typeof user.user === "object"
      ? user.user
      : user;


  if (!safeUser) {

    return "User";

  }


  const directName =
    safeUser.name ||
    safeUser.full_name ||
    safeUser.display_name ||
    safeUser.username;


  if (
    String(
      directName || ""
    ).trim()
  ) {

    return String(
      directName
    ).trim();

  }


  const combinedName =
    [
      safeUser.first_name,
      safeUser.last_name,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      )
      .trim();


  if (combinedName) {

    return combinedName;

  }


  const email =
    String(
      safeUser.email || ""
    ).trim();


  if (
    email.includes(
      "@"
    )
  ) {

    return email
      .split(
        "@"
      )[0];

  }


  return "User";

}


export function getUserFirstName(
  user
) {

  const displayName =
    getUserDisplayName(
      user
    );


  return (
    displayName
      .trim()
      .split(
        /\s+/
      )[0] ||
    "User"
  );

}


export function getCompanyColor(
  companyName = ""
) {

  const colors = [
    "#7C8EA3",
    "#B58A42",
    "#5D8A7A",
    "#8A6D9C",
    "#B46A5A",
    "#607D8B",
  ];


  const value =
    String(
      companyName || ""
    );


  let hash = 0;


  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {

    hash =
      value.charCodeAt(
        index
      ) +
      (
        (
          hash << 5
        ) -
        hash
      );

  }


  return colors[
    Math.abs(
      hash
    ) %
    colors.length
  ];

}


export function getStoredUser() {

  try {

    const storedUser =
      localStorage.getItem(
        "user"
      );


    if (!storedUser) {

      return null;

    }


    const parsedUser =
      JSON.parse(
        storedUser
      );


    if (
      !parsedUser ||
      typeof parsedUser !== "object"
    ) {

      return null;

    }


    return parsedUser;

  } catch {

    return null;

  }

}


export function buildActivityData(
  jobs = []
) {
  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const days = [];

  for (
    let offset = 6;
    offset >= 0;
    offset -= 1
  ) {
    const date =
      new Date(today);

    date.setDate(
      today.getDate() -
      offset
    );

    const key =
      [
        date.getFullYear(),
        String(
          date.getMonth() + 1
        ).padStart(2, "0"),
        String(
          date.getDate()
        ).padStart(2, "0"),
      ].join("-");

    days.push({
      key,

      label:
        new Intl.DateTimeFormat(
          "en-IN",
          {
            weekday: "short",
          }
        ).format(date),

      value: 0,
    });
  }


  const dayMap =
    new Map(
      days.map(
        (day) => [
          day.key,
          day,
        ]
      )
    );


  /*
   * Fallback only.
   *
   * The real dashboard should use
   * summary.activity from the backend.
   */
  jobs.forEach(
    (job) => {
      if (
        !job ||
        job.status !== "applied"
      ) {
        return;
      }

      const value =
        job.last_email_at ||
        job.created_at;

      if (!value) {
        return;
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return;
      }

      const key =
        [
          date.getFullYear(),
          String(
            date.getMonth() + 1
          ).padStart(2, "0"),
          String(
            date.getDate()
          ).padStart(2, "0"),
        ].join("-");

      const day =
        dayMap.get(key);

      if (day) {
        day.value += 1;
      }
    }
  );


  return days;
}