import { Quarter, InfoCardData } from "@repo/shared";
import { getAverageMonthlyBurn, getBurnEfficency, getCogsPercentageOfRevenue, getExpensePercentageOfOpex, getGrossMarginPercentage, getNetProfitLoss, getOpexRevenueRatio, getProfit } from "@/lib/accounting-formulas";

export function getDateRangeFromQuarter(quarter: Quarter, year: number) {
  let startDate: string;
  let endDate: string;
  let monthsInPeriod: number;

  switch (quarter) {
    case "year":
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
      monthsInPeriod = 12;
      break;
    case "q1":
      startDate = `${year}-01-01`;
      endDate = `${year}-03-31`;
      monthsInPeriod = 3;
      break;
    case "q2":
      startDate = `${year}-04-01`;
      endDate = `${year}-06-30`;
      monthsInPeriod = 3;
      break;
    case "q3":
      startDate = `${year}-07-01`;
      endDate = `${year}-09-30`;
      monthsInPeriod = 3;
      break;
    case "q4":
      startDate = `${year}-10-01`;
      endDate = `${year}-12-31`;
      monthsInPeriod = 3;
      break;
  }

  return { startDate, endDate, monthsInPeriod }
}

export function buildInfoCards(
  totalRevenueResult: number, totalCogsResult: number, totalOpexResult: number, burnResult: number,
  topExpenseResult: { category: string; total: number } | null,monthsInPeriod: number, year: number
): InfoCardData[] {
  const cards: InfoCardData[] = [];

  if (totalRevenueResult != null) {
    cards.push({
      title: "Total Revenue",
      value: `$${totalRevenueResult}`,
      info: `Revenue for ${year}`
    });
  }

  if (totalCogsResult != null && totalRevenueResult != null) {
    cards.push({
      title: "Cost of Goods Sold",
      value: `$${totalCogsResult}`,
      info: `${getCogsPercentageOfRevenue(totalCogsResult, totalRevenueResult)}% of Rev`
    });
  }

  if (totalCogsResult != null && totalRevenueResult != null) {
    cards.push({
      title: "Gross Margin",
      value: `${getGrossMarginPercentage(totalCogsResult, totalRevenueResult)}%`,
      info: `$${getProfit(totalRevenueResult, totalCogsResult)} Profit`
    });
  }

  if (totalRevenueResult != null && totalCogsResult != null && totalOpexResult != null) {
    const net = getNetProfitLoss(totalRevenueResult, totalCogsResult, totalOpexResult);
    cards.push({
      title: "Net Profit/Loss",
      value: net < 0 ? `-$${Math.abs(net).toFixed(2)}` : `$${net.toFixed(2)}`,
      info: "Includes all expenses"
    });
  }

  if (totalOpexResult != null && totalRevenueResult != null) {
    cards.push({
      title: "Total Opex",
      value: `$${totalOpexResult}`,
      info: `${getBurnEfficency(totalOpexResult, totalRevenueResult)}`
    });
  }

  if (totalOpexResult != null && totalRevenueResult != null) {
    cards.push({
      title: "Opex/Revenue Ratio",
      value: `${getOpexRevenueRatio(totalOpexResult, totalRevenueResult)}%`,
      info: `Opex as a percentage of revenue for ${year}`
    });
  }

  if (burnResult != null && monthsInPeriod != null) {
    cards.push({
      title: "Avg Monthly Burn",
      value: `$${getAverageMonthlyBurn(burnResult, monthsInPeriod)}`,
      info: `Net Loss / Month`
    });
  }

  if (topExpenseResult != null && totalOpexResult != null) {
    cards.push({
      title: "Top Expense",
      value: `${topExpenseResult.category}`,
      info: `${getExpensePercentageOfOpex(topExpenseResult.total, totalOpexResult)}% of OpEx`
    });
  }

  return cards;
}
