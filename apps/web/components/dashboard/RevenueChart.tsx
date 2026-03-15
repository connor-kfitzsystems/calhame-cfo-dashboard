"use client";

import type { RevenueExpenseChartData } from "@repo/shared";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface RevenueChartProps {
  data: RevenueExpenseChartData[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RevenueChart({ data }: RevenueChartProps) {

  if (!data || data.length === 0) {
    return null;
  }

  const config = {
    revenue: { label: "Revenue", color: "#3b82f6" },
    opex: { label: "OpEx", color: "#ef4444" }
  }

  const sortedData = [...data]
    .map((row) => {
      const date = new Date(row.month);
      const monthIndex = date.getMonth();
      return {
        monthIndex,
        monthLabel: MONTHS[monthIndex],
        revenue: row.revenue !== null ? Number(row.revenue) : null,
        opex: row.opex !== null ? Number(row.opex) : null,
      }
    })
    .sort((a, b) => a.monthIndex - b.monthIndex);

  // Don't render if all data points are null
  const hasData = sortedData.some((row) => row.revenue !== null || row.opex !== null);
  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <LineChart data={sortedData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted"/>
            <XAxis
              dataKey="monthLabel"
              className="text-xs"
              tickLine={false}
              axisLine={false}
              tick={{ dy: 10 }}
            />
            <YAxis className="text-xs" tickLine={false} axisLine={false} tick={{ dx: -10 }}/>
            <ChartTooltip content={<ChartTooltipContent/>}/>
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="opex"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
