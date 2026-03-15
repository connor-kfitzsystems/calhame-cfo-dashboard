"use client";

import type { OpexCompChartData } from "@repo/shared";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { getChartColor } from "@/lib/helpers";

interface OpexPieChartProps {
  data: OpexCompChartData[];
}

export default function OpexPieChart({ data }: OpexPieChartProps) {

  const chartData = data
    .filter((item) => item.total > 0)
    .map((item, index) => ({
      name: item.category,
      value: Number(item.total),
      fill: getChartColor(index)
    }));

  if (!chartData || chartData.length === 0) return null;

  const config = chartData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: getChartColor(index)
    }
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer config={config} className="h-[320px] w-full">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent/>}
          formatter={(value) => {
            const percentage = ((Number(value) / total) * 100).toFixed(1);
            return `$${Number(value).toLocaleString()} (${percentage}%)`;
          }}
        />
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          labelLine={true}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill}/>
          ))}
        </Pie>
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
        />
      </PieChart>
    </ChartContainer>
  );
}
