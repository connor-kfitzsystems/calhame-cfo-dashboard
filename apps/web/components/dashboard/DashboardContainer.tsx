import InfoCard from "./InfoCard";
import QuarterSelection from "./QuarterSelection";
import RevenueChart from "./RevenueChart";
import OpexPieChart from "./OpexPieChart";

import { DashboardData, Quarter } from "@repo/shared";

interface DashboardContainerProps {
  data: DashboardData;
  quarter: Quarter;
  year: number;
}

export default function DashboardContainer({ data, quarter, year }: DashboardContainerProps) {

  return (
    <div className="flex flex-col gap-4">
      <QuarterSelection value={quarter} year={year}/>
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.infoCards.map((card, index) => (
          <li key={index} className="min-w-0">
            <InfoCard
              title={card.title}
              value={card.value}
              info={card.info}
              className="w-full"
            />
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RevenueChart data={data.revenueExpenseChartData}/>
        <OpexPieChart data={data.opexCompChartData}/>
      </div>
    </div>
  );
}
