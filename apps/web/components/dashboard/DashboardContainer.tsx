import InfoCard from "./InfoCard";
import QuarterSelection from "./QuarterSelection";
import YearSelection from "./YearSelection";
import OpexCompositionCard from "./charts/OpexCompositionCard";
import RevenueExpenseCard from "./charts/RevenueExpenseCard";

import { DashboardData, Quarter } from "@repo/shared";

interface DashboardContainerProps {
  data: DashboardData;
  quarter: Quarter;
  year: number;
}

export default function DashboardContainer({ data, quarter, year }: DashboardContainerProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <YearSelection value={year} years={data.years}/>
        <QuarterSelection value={quarter} year={year} quarters={data.quarters}/>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.infoCards.map((card, index) => (
          <li key={index} className="min-w-0 h-full">
            <InfoCard
              title={card.title}
              value={card.value}
              info={card.info}
              className="w-full h-full"
            />
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RevenueExpenseCard data={data.revenueExpenseChartData}/>
        <OpexCompositionCard data={data.opexCompChartData}/>
      </div>
    </div>
  );
}
