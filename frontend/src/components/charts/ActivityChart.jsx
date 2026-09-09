function getValue(
  item
) {
  return Number(
    item?.value ??
    item?.applications ??
    0
  );
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


  const width = 720;
  const height = 260;

  const paddingLeft = 38;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 42;

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
    points
      .map(
        (
          point,
          index
        ) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      )
      .join(" ");


  const baseline =
    height -
    paddingBottom;


  const areaPath =
    [
      `M ${points[0].x} ${baseline}`,
      ...points.map(
        (point) =>
          `L ${point.x} ${point.y}`
      ),
      `L ${
        points[
          points.length - 1
        ].x
      } ${baseline}`,
      "Z",
    ]
      .join(" ");


  return (
    <div className="hl-activity-chart">

      <svg
        viewBox={
          `0 0 ${width} ${height}`
        }
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
              stopOpacity="0.30"
            />

            <stop
              offset="100%"
              stopColor="#873bbf"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>


        {
          [0, 1, 2, 3, 4].map(
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
          )
        }


        <path
          d={areaPath}
          className="hl-chart-area"
        />

        <path
          d={linePath}
          className="hl-chart-line"
        />


        {
          points.map(
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
                  r="4"
                  className="hl-chart-dot"
                />

                <text
                  x={point.x}
                  y={height - 14}
                  textAnchor="middle"
                  className="hl-chart-label"
                >
                  {
                    point.label ||
                    ""
                  }
                </text>
              </g>
            )
          )
        }

      </svg>

    </div>
  );
}
