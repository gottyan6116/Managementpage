"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";

/** スパークライン (KPI 折れ線) */
export function Sparkline({
  data,
  color = "#3B82F6",
  height = 44,
  width = 96,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, bottom: 4, left: 2, right: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** ミニ棒グラフ */
export function MiniBarChart({
  data,
  color = "#8B5CF6",
  height = 44,
  width = 96,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 4, bottom: 0, left: 0, right: 0 }} barCategoryGap={2}>
          <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** ドーナツ (中心ラベル付き) */
export function Donut({
  slices,
  size = 96,
  thickness = 12,
  centerTop,
  centerBottom,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerTop?: React.ReactNode;
  centerBottom?: React.ReactNode;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const data = total === 0 ? [{ label: "なし", value: 1, color: "#E8EDF3" }] : slices;
  const outer = size / 2;
  const inner = outer - thickness;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={inner}
            outerRadius={outer}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            paddingAngle={total > 1 ? 2 : 0}
          >
            {data.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerTop || centerBottom) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerTop && (
            <span className="text-base font-bold leading-none text-ink">{centerTop}</span>
          )}
          {centerBottom && (
            <span className="text-[10px] text-ink-muted mt-0.5">{centerBottom}</span>
          )}
        </div>
      )}
    </div>
  );
}
