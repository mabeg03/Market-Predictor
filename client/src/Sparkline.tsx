import React from "react";

export default function Sparkline({
  data = [0],
  stroke = "#00e676",
  width = 220,
  height = 40
}: {
  data?: number[];
  stroke?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) data = [0];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
