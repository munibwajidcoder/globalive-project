import React from "react";

interface MiniAreaChartProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}

export default function MiniAreaChart({ data, width = 240, height = 56, stroke = "#8b5cf6", fill = "rgba(139,92,246,0.12)", className }: MiniAreaChartProps) {
  if (!data || data.length === 0) return <div className={className} />;

  // Use a fixed viewBox width but render the svg responsively (width:100%) so it scales down inside cards
  const viewW = width;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const stepX = viewW / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = +(i * stepX).toFixed(2);
    const y = +(((max - d) / range) * (height - 6) + 3).toFixed(2); // padding
    return `${x},${y}`;
  });

  const polylinePoints = points.join(" ");
  const areaPath = `M0,${height} L ${points.map((p) => p).join(" L ")} L ${viewW},${height} Z`;

  return (
    <div className={"overflow-hidden " + (className || "")}>
      <svg viewBox={`0 0 ${viewW} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-hidden>
        <defs>
          <linearGradient id="mg" x1="0" x2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.9" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={fill} />
        <polyline fill="none" stroke="url(#mg)" strokeWidth={2} points={polylinePoints} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
