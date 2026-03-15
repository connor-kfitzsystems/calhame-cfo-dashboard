"use client"

import { MONTHS, type RevenueExpenseChartData } from "@repo/shared";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

interface RevenueExpenseBarChartProps {
  data: RevenueExpenseChartData[];
}

export default function RevenueExpenseBarChart({ data }: RevenueExpenseBarChartProps) {

  if (!data || data.length === 0) return null;
  
  const config = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
    expenses: { label: "Expenses", color: "var(--chart-2)" }
  }

  const sortedData = [...data]
    .map((row) => {
      const date = new Date(row.month);
      const monthIndex = date.getMonth();
      return {
        monthIndex,
        monthLabel: MONTHS[monthIndex],
        revenue: row.revenue !== null ? Number(row.revenue) : null,
        expenses: row.expenses !== null ? Number(row.expenses) : null,
      }
    })
    .sort((a, b) => a.monthIndex - b.monthIndex);

  const hasData = sortedData.some((row) => row.revenue !== null || row.expenses !== null);

  if (!hasData) return null;

  return (
    <ChartContainer config={config} className="h-[320px] w-full">
      <BarChart data={sortedData} barGap={4} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false}/>
        <XAxis
          dataKey="monthLabel"
          className="text-xs"
          tickLine={false}
          axisLine={false}
          tick={{ dy: 10 }}
        />
        <YAxis
          className="text-xs"
          tickLine={false}
          axisLine={false}
          tick={{ dx: -10 }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <ChartTooltip content={<ChartTooltipContent/>}/>
        <Legend
          iconType="square"
          wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
          iconSize={12}
        />
        <Bar
          dataKey="revenue"
          name="Revenue"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="expenses"
          name="Expenses"
          fill="var(--chart-2)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ChartContainer>
  );
}
