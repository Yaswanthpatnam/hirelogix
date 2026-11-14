import { useMemo, useState } from "react";

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const rad = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r_inner, r_outer, startAngle, endAngle) {
  const span = Math.min(Math.max(endAngle - startAngle, 0.01), 359.99);
  const effectiveEnd = startAngle + span;

  const startOut = polarToCartesian(cx, cy, r_outer, startAngle);
  const endOut = polarToCartesian(cx, cy, r_outer, effectiveEnd);
  const startIn = polarToCartesian(cx, cy, r_inner, startAngle);
  const endIn = polarToCartesian(cx, cy, r_inner, effectiveEnd);

  const largeArc = span > 180 ? 1 : 0;

  return [
    `M ${startOut.x} ${startOut.y}`,
    `A ${r_outer} ${r_outer} 0 ${largeArc} 1 ${endOut.x} ${endOut.y}`,
    `L ${endIn.x} ${endIn.y}`,
    `A ${r_inner} ${r_inner} 0 ${largeArc} 0 ${startIn.x} ${startIn.y}`,
    "Z",
  ].join(" ");
}

export default function DonutChart({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const total = useMemo(
    () =>
      safeData.reduce(
        (sum, item) => sum + Number(item?.value || 0),
        0
      ),
    [safeData]
  );

  const cx = 115;
  const cy = 115;
  const r_inner = 68;
  const r_outer = 96;

  const segments = useMemo(() => {
    if (total <= 0) return [];

    let currentAngle = 0;
    const activeItems = safeData.filter((d) => Number(d?.value || 0) > 0);

    return activeItems.map((item) => {
      const val = Number(item.value || 0);
      const angle = (val / total) * 360;
      const startAngle = currentAngle;
      const endAngle = startAngle + angle;
      currentAngle = endAngle;

      const path = describeArc(cx, cy, r_inner, r_outer, startAngle, endAngle);
      const pct = ((val / total) * 100).toFixed(1);

      return {
        ...item,
        val,
        pct,
        startAngle,
        endAngle,
        path,
      };
    });
  }, [safeData, total]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className="hl-donut-container"
      role="img"
      aria-label="Application status distribution"
      onMouseMove={handleMouseMove}
      style={{ position: "relative", width: "230px", height: "230px" }}
    >
      <svg
        viewBox="0 0 230 230"
        width="230"
        height="230"
        className="hl-donut-svg"
        style={{ overflow: "visible" }}
      >
        {/* Background track if empty */}
        {total <= 0 ? (
          <path
            d={describeArc(cx, cy, r_inner, r_outer, 0, 360)}
            fill="#2a2230"
          />
        ) : (
          segments.map((seg) => {
            const isHovered = hovered?.status === seg.status;
            return (
              <path
                key={seg.status || seg.name}
                d={seg.path}
                fill={seg.color || "#6E7A89"}
                className="hl-donut-slice"
                style={{
                  cursor: "pointer",
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                  transformOrigin: `${cx}px ${cy}px`,
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  opacity: hovered && !isHovered ? 0.45 : 1,
                  filter: isHovered ? `drop-shadow(0 0 8px ${seg.color || "#fff"}88)` : "none",
                }}
                onMouseEnter={() => setHovered(seg)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })
        )}

        {/* Center hole content */}
        <g style={{ pointerEvents: "none" }}>
          {hovered ? (
            <>
              <text
                x={cx}
                y={cy - 8}
                textAnchor="middle"
                fill={hovered.color || "#fff"}
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "capitalize",
                  letterSpacing: "0.5px",
                }}
              >
                {hovered.name || hovered.status}
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fill="#ffffff"
                style={{ fontSize: "16px", fontWeight: 800 }}
              >
                {hovered.val}{" "}
                <tspan style={{ fontSize: "11px", fill: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                  ({hovered.pct}%)
                </tspan>
              </text>
            </>
          ) : (
            <>
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                fill="#ffffff"
                style={{ fontSize: "20px", fontWeight: 800 }}
              >
                {total}
              </text>
              <text
                x={cx}
                y={cy + 13}
                textAnchor="middle"
                fill="rgba(246,241,248,0.55)"
                style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px" }}
              >
                Total Apps
              </text>
            </>
          )}
        </g>
      </svg>

      {/* Floating Hover Badge / Tooltip */}
      {hovered && (
        <div
          className="hl-donut-floating-tooltip"
          style={{
            position: "absolute",
            left: `${Math.min(Math.max(tooltipPos.x, 10), 160)}px`,
            top: `${Math.max(tooltipPos.y - 42, 6)}px`,
            pointerEvents: "none",
            background: "rgba(16, 11, 21, 0.94)",
            border: `1px solid ${hovered.color || "rgba(255,255,255,0.2)"}`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${hovered.color || "transparent"}44`,
            borderRadius: "8px",
            padding: "5px 10px",
            fontSize: "12px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            zIndex: 30,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: hovered.color,
              display: "inline-block",
            }}
          />
          <strong style={{ color: hovered.color }}>{hovered.name || hovered.status}:</strong>
          <span>
            {hovered.val} ({hovered.pct}%)
          </span>
        </div>
      )}
    </div>
  );
}
