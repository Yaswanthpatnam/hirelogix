function getValue(item) {
  return Number(
    item?.value ??
      item?.applications ??
      0
  );
}


/*
 * Creates a smooth cubic curve through
 * the supplied points.
 */
function buildSmoothPath(points) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const smoothing = 0.18;

  const getControlPoint = (
    current,
    previous,
    next,
    reverse = false
  ) => {
    const previousPoint =
      previous || current;

    const nextPoint =
      next || current;

    const dx =
      nextPoint.x -
      previousPoint.x;

    const dy =
      nextPoint.y -
      previousPoint.y;

    const angle =
      Math.atan2(dy, dx) +
      (reverse ? Math.PI : 0);

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      ) * smoothing;

    return {
      x:
        current.x +
        Math.cos(angle) *
          distance,

      y:
        current.y +
        Math.sin(angle) *
          distance,
    };
  };


  let path =
    `M ${points[0].x} ${points[0].y}`;


  for (
    let index = 0;
    index < points.length - 1;
    index += 1
  ) {
    const current =
      points[index];

    const next =
      points[index + 1];

    const previous =
      points[index - 1];

    const nextNext =
      points[index + 2];


    const control1 =
      getControlPoint(
        current,
        previous,
        next
      );


    const control2 =
      getControlPoint(
        next,
        current,
        nextNext,
        true
      );


    path +=
      ` C ${control1.x} ${control1.y}` +
      ` ${control2.x} ${control2.y}` +
      ` ${next.x} ${next.y}`;
  }


  return path;
}


export default function ActivityChart({
  data = [],
}) {
  const safeData =
    Array.isArray(data)
      ? data
      : [];


  if (
    safeData.length === 0
  ) {
    return (
      <div className="hl-activity-empty">
        No activity data available yet.
      </div>
    );
  }


  /*
   * Fixed internal chart size.
   *
   * CSS controls the actual panel size.
   */
  const width = 720;
  const height = 300;


  const paddingLeft = 34;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 34;


  const values =
    safeData.map(getValue);


  const maxValue =
    Math.max(
      ...values,
      1
    );


  const chartWidth =
    width -
    paddingLeft -
    paddingRight;


  const chartHeight =
    height -
    paddingTop -
    paddingBottom;


  const points =
    safeData.map(
      (
        item,
        index
      ) => {
        const value =
          getValue(item);


        const x =
          paddingLeft +
          (
            index /
            Math.max(
              safeData.length - 1,
              1
            )
          ) *
            chartWidth;


        const y =
          paddingTop +
          chartHeight -
          (
            value /
            maxValue
          ) *
            chartHeight;


        return {
          ...item,
          value,
          x,
          y,
        };
      }
    );


  const linePath =
    buildSmoothPath(
      points
    );


  const baseline =
    height -
    paddingBottom;


  const smoothPath =
    buildSmoothPath(
      points
    );


  const areaPath =
    points.length > 0
      ? [
          `M ${points[0].x} ${baseline}`,

          smoothPath.replace(
            /^M [^ ]+ [^ ]+/,
            `L ${points[0].x} ${points[0].y}`
          ),

          `L ${
            points[
              points.length - 1
            ].x
          } ${baseline}`,

          "Z",
        ].join(" ")
      : "";


  return (
    <div className="hl-activity-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Application activity chart"
      >

        <defs>
          <linearGradient
            id="hirelogixActivityFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#873bbf"
              stopOpacity="0.26"
            />

            <stop
              offset="100%"
              stopColor="#873bbf"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>


        {/* Grid */}
        {[0, 1, 2, 3, 4].map(
          (index) => {
            const y =
              paddingTop +
              (
                chartHeight /
                4
              ) *
                index;


            return (
              <line
                key={index}
                x1={paddingLeft}
                x2={
                  width -
                  paddingRight
                }
                y1={y}
                y2={y}
                className="hl-chart-grid-line"
              />
            );
          }
        )}


        {/* Gradient area */}
        <path
          d={areaPath}
          className="hl-chart-area"
        />


        {/* Smooth wave line */}
        <path
          d={linePath}
          className="hl-chart-line"
        />


        {/* Points + labels */}
        {points.map(
          (
            point,
            index
          ) => (
            <g
              key={
                point.key ||
                point.label ||
                index
              }
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="3.5"
                className="hl-chart-dot"
              />

              <text
                x={point.x}
                y={
                  height -
                  10
                }
                textAnchor="middle"
                className="hl-chart-label"
              >
                {point.label || ""}
              </text>
            </g>
          )
        )}

      </svg>
    </div>
  );
}