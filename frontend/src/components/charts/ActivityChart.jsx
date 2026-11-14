import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

function getValue(item) {
  return Number(
    item?.value ??
      item?.applications ??
      0
  );
}

function formatDate(isoDateStr) {
  if (!isoDateStr) return "";
  try {
    const d = new Date(isoDateStr + "T00:00:00");
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch (_) {
    return isoDateStr;
  }
}

function formatDayFull(isoDateStr) {
  if (!isoDateStr) return "";
  try {
    const d = new Date(isoDateStr + "T00:00:00");
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch (_) {
    return isoDateStr;
  }
}

function buildSmoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const smoothing = 0.18;

  const getControlPoint = (current, previous, next, reverse = false) => {
    const previousPoint = previous || current;
    const nextPoint = next || current;
    const dx = nextPoint.x - previousPoint.x;
    const dy = nextPoint.y - previousPoint.y;
    const angle = Math.atan2(dy, dx) + (reverse ? Math.PI : 0);
    const distance = Math.sqrt(dx * dx + dy * dy) * smoothing;

    return {
      x: current.x + Math.cos(angle) * distance,
      y: current.y + Math.sin(angle) * distance,
    };
  };

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1];
    const nextNext = points[index + 2];

    const control1 = getControlPoint(current, previous, next);
    const control2 = getControlPoint(next, current, nextNext, true);

    path += ` C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${next.x} ${next.y}`;
  }

  return path;
}

export default function ActivityChart({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];
  const WINDOW_SIZE = 7;

  // Window start index: default to showing the latest 7 days
  const maxStart = Math.max(0, safeData.length - WINDOW_SIZE);
  const [startIndex, setStartIndex] = useState(maxStart);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Swipe / Drag handling state
  const touchStartX = useRef(null);
  const isDragging = useRef(false);
  const mouseStartX = useRef(null);

  // Keep start index within valid bounds when data changes
  const clampedStart = Math.min(Math.max(0, startIndex), maxStart);

  const windowData = useMemo(() => {
    if (safeData.length === 0) return [];
    if (safeData.length <= WINDOW_SIZE) return safeData;
    return safeData.slice(clampedStart, clampedStart + WINDOW_SIZE);
  }, [safeData, clampedStart]);

  const windowTotal = useMemo(() => {
    return windowData.reduce((sum, item) => sum + getValue(item), 0);
  }, [windowData]);

  const firstDate = windowData[0]?.key;
  const lastDate = windowData[windowData.length - 1]?.key;
  const isAtLatest = clampedStart >= maxStart;
  const isAtEarliest = clampedStart <= 0;

  const handlePrevDay = useCallback(() => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextDay = useCallback(() => {
    setStartIndex((prev) => Math.min(maxStart, prev + 1));
  }, [maxStart]);

  const handlePrevWeek = useCallback(() => {
    setStartIndex((prev) => Math.max(0, prev - 7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setStartIndex((prev) => Math.min(maxStart, prev + 7));
  }, [maxStart]);

  const handleResetToLatest = useCallback(() => {
    setStartIndex(maxStart);
  }, [maxStart]);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        // Swiped right -> go back to earlier dates
        handlePrevDay();
      } else {
        // Swiped left -> advance to later dates
        handleNextDay();
      }
    }
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    isDragging.current = true;
    mouseStartX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || mouseStartX.current === null) return;
    const diff = e.clientX - mouseStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handlePrevDay();
      } else {
        handleNextDay();
      }
      mouseStartX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    mouseStartX.current = null;
  };

  if (safeData.length === 0) {
    return (
      <div className="hl-activity-empty">
        No activity data available yet.
      </div>
    );
  }

  const width = 720;
  const height = 300;
  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 45;

  const values = windowData.map(getValue);
  const maxValue = Math.max(...values, 4);

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = windowData.map((item, index) => {
    const value = getValue(item);
    const x =
      paddingLeft +
      (index / Math.max(windowData.length - 1, 1)) * chartWidth;
    const y =
      paddingTop + chartHeight - (value / maxValue) * chartHeight;

    return {
      ...item,
      value,
      x,
      y,
      date_str: item.key,
      date_formatted: formatDate(item.key),
      date_full: formatDayFull(item.key),
    };
  });

  const smoothPath = buildSmoothPath(points);
  const baseline = height - paddingBottom;

  const areaPath =
    points.length > 0
      ? [
          `M ${points[0].x} ${baseline}`,
          smoothPath.replace(
            /^M [^ ]+ [^ ]+/,
            `L ${points[0].x} ${points[0].y}`
          ),
          `L ${points[points.length - 1].x} ${baseline}`,
          "Z",
        ].join(" ")
      : "";

  return (
    <div className="hl-activity-container">
      {/* Dynamic Timeline Navigation Bar */}
      <div className="hl-activity-toolbar">
        <div className="hl-activity-range-info">
          <span className="hl-activity-range-dates">
            {formatDate(firstDate)} — {formatDate(lastDate)}
          </span>
          <span className="hl-activity-range-count">
            <strong>{windowTotal}</strong> application{windowTotal === 1 ? "" : "s"}
          </span>
        </div>

        <div className="hl-activity-controls">
          {!isAtLatest && (
            <button
              type="button"
              className="hl-activity-ctrl-btn hl-activity-latest-btn"
              onClick={handleResetToLatest}
              title="Jump to today"
            >
              <RotateCcw size={12} />
              <span>Latest</span>
            </button>
          )}

          <button
            type="button"
            className="hl-activity-ctrl-btn"
            onClick={handlePrevWeek}
            disabled={isAtEarliest}
            title="Go back 7 days"
          >
            -7d
          </button>

          <button
            type="button"
            className="hl-activity-ctrl-btn"
            onClick={handlePrevDay}
            disabled={isAtEarliest}
            title="Go back 1 day (Swipe right)"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="hl-activity-swipe-hint">Swipe left/right to browse</span>

          <button
            type="button"
            className="hl-activity-ctrl-btn"
            onClick={handleNextDay}
            disabled={isAtLatest}
            title="Go forward 1 day (Swipe left)"
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            className="hl-activity-ctrl-btn"
            onClick={handleNextWeek}
            disabled={isAtLatest}
            title="Forward 7 days"
          >
            +7d
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart with Swipe and Drag Handlers */}
      <div
        className="hl-activity-chart"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: "grab", position: "relative" }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Application activity timeline"
        >
          <defs>
            <linearGradient
              id="hirelogixActivityFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#873bbf" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#873bbf" stopOpacity="0.01" />
            </linearGradient>

            <filter id="activityGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((index) => {
            const y = paddingTop + (chartHeight / 4) * index;
            const gridVal = Math.round(maxValue - (maxValue / 4) * index);
            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  className="hl-chart-grid-line"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.25)"
                  style={{ fontSize: "10px", fontFamily: "sans-serif" }}
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Gradient area */}
          <path d={areaPath} className="hl-chart-area" />

          {/* Smooth line */}
          <path d={smoothPath} className="hl-chart-line" />

          {/* Hover vertical guide line */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              x2={hoveredPoint.x}
              y1={paddingTop}
              y2={baseline}
              stroke="rgba(155, 99, 202, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Points + X-axis day & date labels */}
          {points.map((point) => {
            const isHovered = hoveredPoint?.date_str === point.date_str;
            return (
              <g
                key={point.key || point.date_str}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Invisible larger hit target */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="16"
                  fill="transparent"
                />

                {/* Visible dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? "6" : "4"}
                  className="hl-chart-dot"
                  style={{
                    transition: "r 0.15s ease",
                    fill: isHovered ? "#d9b8ea" : "#9b63ca",
                    filter: isHovered ? "url(#activityGlow)" : "none",
                  }}
                />

                {/* Day name (e.g. Wed) */}
                <text
                  x={point.x}
                  y={height - 24}
                  textAnchor="middle"
                  className="hl-chart-label"
                  style={{
                    fontWeight: isHovered ? 700 : 500,
                    fill: isHovered ? "#ffffff" : "rgba(246,241,248,0.7)",
                  }}
                >
                  {point.label || ""}
                </text>

                {/* Date snippet (e.g. Nov 11) */}
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  style={{
                    fontSize: "9px",
                    fill: isHovered ? "#cfa6ee" : "rgba(246,241,248,0.4)",
                    fontWeight: isHovered ? 600 : 400,
                  }}
                >
                  {point.date_label || point.date_formatted?.split(",")[0] || ""}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="hl-activity-tooltip"
            style={{
              position: "absolute",
              left: `${Math.min(Math.max((hoveredPoint.x / width) * 100, 10), 90)}%`,
              top: `${Math.max((hoveredPoint.y / height) * 100 - 18, 5)}%`,
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
              background: "rgba(16, 11, 21, 0.96)",
              border: "1px solid rgba(155, 99, 202, 0.5)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.6), 0 0 16px rgba(135, 59, 191, 0.3)",
              borderRadius: "8px",
              padding: "7px 12px",
              zIndex: 40,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontSize: "11px", color: "rgba(246,241,248,0.65)", marginBottom: "2px" }}>
              {hoveredPoint.date_full}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
              <span style={{ color: "#d9b8ea" }}>{hoveredPoint.value}</span>{" "}
              {hoveredPoint.value === 1 ? "application" : "applications"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
