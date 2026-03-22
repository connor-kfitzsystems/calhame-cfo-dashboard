import { Quarter, InfoCardData } from "@repo/shared";
import { getAverageMonthlyBurn, getBurnEfficency, getCogsPercentageOfRevenue, getExpensePercentageOfOpex, getGrossMarginPercentage, getNetProfitLoss, getOpexRevenueRatio, getProfit, formatCurrency } from "@/lib/accounting-formulas";

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
      value: `$${formatCurrency(totalRevenueResult)}`,
      info: `Revenue for ${year}`
    });
  }

  if (totalCogsResult != null && totalRevenueResult != null) {
    cards.push({
      title: "Cost of Goods Sold",
      value: `$${formatCurrency(totalCogsResult)}`,
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
    const isNegative = net.startsWith('-');
    cards.push({
      title: "Net Profit/Loss",
      value: isNegative ? `-$${net.substring(1)}` : `$${net}`,
      info: "Includes all expenses"
    });
  }

  if (totalOpexResult != null && totalRevenueResult != null) {
    cards.push({
      title: "Total Opex",
      value: `$${formatCurrency(totalOpexResult)}`,
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
    const formattedCategory = topExpenseResult.category.replace(/:\s*/g, ': ');
    cards.push({
      title: "Top Expense",
      value: `${formattedCategory}`,
      info: `${getExpensePercentageOfOpex(topExpenseResult.total, totalOpexResult)}% of OpEx`
    });
  }

  return cards;
}

export function getChartColor(index: number): string {
  const colorIndex = (index % 10) + 1;
  return `var(--chart-${colorIndex})`;
}

export function getSyncAvailability(lastSyncedAt: Date | null): {
  canSync: boolean;
  timeRemaining?: string;
} {
  if (!lastSyncedAt) {
    return { canSync: true };
  }

  const now = new Date();
  const lastSync = new Date(lastSyncedAt);
  const thirtySecondsInMs = 30 * 1000;
  const timeSinceLastSync = now.getTime() - lastSync.getTime();

  if (timeSinceLastSync >= thirtySecondsInMs) {
    return { canSync: true };
  }

  const timeRemainingMs = thirtySecondsInMs - timeSinceLastSync;
  const totalMinutes = Math.floor(timeRemainingMs / (60 * 1000));
  const seconds = Math.floor((timeRemainingMs % (60 * 1000)) / 1000);

  const timeRemaining = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return { canSync: false, timeRemaining };
}

export function generateURIFromBase(path: string, headers?: Headers): string {

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    return `${appUrl}${path}`;
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) {
    return `https://${vercelProductionUrl}${path}`;
  }

  if (headers) {
    const host = headers.get('x-forwarded-host') || headers.get('host');
    if (host && host.includes('localhost')) {
      return `http://localhost:3000${path}`;
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}${path}`;
  }

  if (headers) {
    const host = headers.get('x-forwarded-host') || headers.get('host');
    if (host) {
      const protocol = host.includes('localhost') ? 'http' : 'https';
      return `${protocol}://${host}${path}`;
    }
  }

  return `http://localhost:3000${path}`;
}
