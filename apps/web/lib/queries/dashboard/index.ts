import getBurn from "./get-burn";
import getCogs from "./get-cogs";
import getOpexCompChartData from "./get-opex-comp-chart-data";
import getRevenueExpenseChartData from "./get-rev-exp-chart-data";
import getRevenue from "./get-revenue";
import getTopExpense from "./get-top-expense";
import getTotalOpex from "./get-total-opex";
import getYears from "./get-years";
import getQuarters from "./get-quarters";

import { DashboardData, Quarter } from "@repo/shared";
import { getAverageMonthlyBurn, getBurnEfficency, getCogsPercentageOfRevenue, getExpensePercentageOfOpex, getGrossMarginPercentage, getNetProfitLoss, getOpexRevenueRatio, getProfit } from "@/lib/accounting-formulas";
import { getDateRangeFromQuarter } from "@/lib/helpers";

export default async function getDashboardData(companyId: string, quarter: Quarter, year: number): Promise<DashboardData> {

  const { startDate, endDate, monthsInPeriod } = getDateRangeFromQuarter(quarter, year);

  const totalRevenueResult = await getRevenue(companyId, startDate, endDate);
  const totalCogsResult = await getCogs(companyId, startDate, endDate);
  const totalOpexResult = await getTotalOpex(companyId, startDate, endDate);
  const burnResult = await getBurn(companyId, startDate, endDate);
  const topExpenseResult = await getTopExpense(companyId, startDate, endDate);

  const revenueExpenseChartData = await getRevenueExpenseChartData(companyId, startDate, endDate);
  const opexCompChartData = await getOpexCompChartData(companyId, startDate, endDate);
  
  const yearsResult = await getYears(companyId);
  const quarters = await getQuarters(companyId, year);

  return {
    years: yearsResult,
    quarters: quarters,
    infoCards: [
      {
        title: "Total Revenue",
        value: `$${totalRevenueResult}`,
        info: `Revenue for ${year}`
      },
      {
        title: "Cost of Goods Sold",
        value: `$${totalCogsResult}`,
        info: `${getCogsPercentageOfRevenue(totalCogsResult, totalRevenueResult)}% of Rev`
      },
      {
        title: "Gross Margin",
        value: `${getGrossMarginPercentage(totalCogsResult, totalRevenueResult)}%`,
        info: `$${getProfit(totalRevenueResult, totalCogsResult)} Profit`
      },
      {
        title: "Net Profit/Loss",
        value: (() => {
          const net = getNetProfitLoss(totalRevenueResult, totalCogsResult, totalOpexResult);
          return net < 0 ? `-$${Math.abs(net).toFixed(2)}` : `$${net.toFixed(2)}`;
        })(),
        info: "Includes all expenses"
      },
      {
        title: "Total Opex",
        value: `$${totalOpexResult}`,
        info: `${getBurnEfficency(totalOpexResult, totalRevenueResult)} Burn`
      },
      {
        title: "Opex/Revenue Ratio",
        value: `${getOpexRevenueRatio(totalOpexResult, totalRevenueResult)}%`,
        info: `Opex as a percentage of revenue for ${year}`
      },
      {
        title: "Avg Monthly Burn",
        value: `$${getAverageMonthlyBurn(burnResult, monthsInPeriod)}`,
        info: `Net Loss / Month`
      },
      {
        title: "Top Expense",
        value: `${topExpenseResult?.category ?? ""}`,
        info: `${getExpensePercentageOfOpex(topExpenseResult?.total ?? 0, totalOpexResult)}% of OpEx`
      }
    ],
    revenueExpenseChartData: revenueExpenseChartData,
    opexCompChartData: opexCompChartData
  }
}
