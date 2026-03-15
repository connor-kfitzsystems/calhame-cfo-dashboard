"use client"

import RevenueExpenseLineChart from "./RevenueExpenseLineChart";
import RevenueExpenseBarChart from "./RevenueExpenseBarChart";

import { useState } from "react";
import { type RevenueExpenseChartData } from "@repo/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";

interface RevenueExpenseCardProps {
  data: RevenueExpenseChartData[];
}

export default function RevenueExpenseCard({ data }: RevenueExpenseCardProps) {
  
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  if (!data || data.length === 0) return null;
  
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Revenue vs Expenses</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
              className="h-8 w-8 p-0"
            >
              <BarChart3 className="h-4 w-4"/>
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
              className="h-8 w-8 p-0"
            >
              <LineChartIcon className="h-4 w-4"/>
            </Button>
          </div>
        </div>
        <CardDescription>Monthly comparison for the selected period</CardDescription>
      </CardHeader>
      <CardContent>
          {chartType === "bar"
            ? <RevenueExpenseBarChart data={data}/>
            : <RevenueExpenseLineChart data={data}/>
          }
      </CardContent>
    </Card>
  );
}
