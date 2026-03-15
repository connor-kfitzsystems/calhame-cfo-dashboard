export function getCogsPercentageOfRevenue(cogs: number, revenue: number): number {
  if (revenue == 0) return 0;
  return parseFloat(((cogs / revenue) * 100).toFixed(2));
}

export function getGrossMarginPercentage(cogs: number, revenue: number): number {
  if (revenue == 0) return 0;
  return parseFloat((((revenue - cogs) / revenue) * 100).toFixed(2));
}

export function getProfit(revenue: number, cogs: number): number {
  return revenue - cogs;
}

export function getNetProfitLoss(revenue: number, cogs: number, opex: number): number {
  return revenue - cogs - opex;
}

export function getBurnEfficency(totalOpex: number, totalRevenue: number): string {
  if (totalRevenue == 0) return "";
  const efficiency = totalOpex / totalRevenue;
  if (efficiency <= 0.6) return "Low Burn";
  if (efficiency <= 1) return "Medium Burn";
  return "High Burn";
}

export function getOpexRevenueRatio(totalOpex: number, totalRevenue: number): number {
  if (totalRevenue == 0) return 0;
  return parseFloat(((totalOpex / totalRevenue) * 100).toFixed(2));
}

export function getAverageMonthlyBurn(totalBurn: number, period: number): number {
  return parseFloat((totalBurn / period).toFixed(2));
}

export function getExpensePercentageOfOpex(expenseAmount: number, totalOpex: number): number {
  if (totalOpex === 0) return 0;
  return parseFloat(((expenseAmount / totalOpex) * 100).toFixed(2));
}
