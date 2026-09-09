import {
  useMemo,
} from "react";


export default function DonutChart({
  data = [],
}) {
  const safeData =
    Array.isArray(data)
      ? data
      : [];


  const total =
    useMemo(
      () =>
        safeData.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item?.value || 0
            ),
          0
        ),
      [
        safeData,
      ]
    );


  const gradient =
    useMemo(
      () => {
        if (
          total <= 0
        ) {
          return (
            "conic-gradient(" +
            "#2a2230 0deg 360deg" +
            ")"
          );
        }

        let currentAngle = 0;

        const segments =
          safeData
            .filter(
              (item) =>
                Number(
                  item?.value || 0
                ) > 0
            )
            .map(
              (item) => {
                const value =
                  Number(
                    item.value || 0
                  );

                const angle =
                  (
                    value /
                    total
                  ) * 360;

                const start =
                  currentAngle;

                const end =
                  start + angle;

                currentAngle = end;

                return (
                  `${item.color || "#6E7A89"} ` +
                  `${start}deg ${end}deg`
                );
              }
            );

        return (
          `conic-gradient(${segments.join(", ")})`
        );
      },
      [
        safeData,
        total,
      ]
    );


  return (
    <div
      className="hl-donut"
      role="img"
      aria-label="Application status distribution"
    >

      <div
        className="hl-donut-ring"
        style={{
          background: gradient,
        }}
      >
        <div className="hl-donut-hole" />
      </div>

    </div>
  );
}
