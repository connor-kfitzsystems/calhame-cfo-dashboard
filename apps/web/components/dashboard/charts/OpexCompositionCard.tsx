"use client"

import OpexPieChart from "./OpexPieChart";
import OpexDonutChart from "./OpexDonutChart";

import { useState } from "react";
import type { OpexCompChartData } from "@repo/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Circle, PieChart as PieChartIcon } from "lucide-react";

interface OpexCompositionCardProps {
  data: OpexCompChartData[];
}

export default function OpexCompositionCard({ data }: OpexCompositionCardProps) {

  const [chartType, setChartType] = useState<"donut" | "pie">("donut");

  if (!data || data.length === 0) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>OpEx Composition</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={chartType === "donut" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("donut")}
              className="h-8 w-8 p-0"
            >
              <Circle className="h-4 w-4"/>
            </Button>
            <Button
              variant={chartType === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("pie")}
              className="h-8 w-8 p-0"
            >
              <PieChartIcon className="h-4 w-4"/>
            </Button>
          </div>
        </div>
        <CardDescription>Operating expense breakdown by category</CardDescription>
      </CardHeader>
      <CardContent>
        {chartType === "donut"
          ? <OpexDonutChart data={data}/>
          : <OpexPieChart data={data}/>
        }
      </CardContent>
    </Card>
  );
}
