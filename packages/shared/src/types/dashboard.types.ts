export type UpdateProfileForm = {
  company: string;
}

export type AccountingProvider = "quickbooks";

export type CompanyListItem = {
  companyMembershipId: string;
  companyId: string;
  companyName: string;
  providerName: string;
}

export type ErrorDialog = {
  title: string;
  message: string;
}

export type DashboardData = {
  companyName: string;
  years: number[];
  quarters: Quarter[];
  infoCards: InfoCardData[];
  revenueExpenseChartData: RevenueExpenseChartData[];
  opexCompChartData: OpexCompChartData[];
}

export type InfoCardData = {
  title: string;
  value: string;
  info?: string;
}

export type RevenueExpenseChartData = {
  month: string;
  revenue: number | null;
  expenses: number | null;
}

export type OpexCompChartData = {
  category: string;
  total: number;
}

export type Quarter = "year" | "q1" | "q2" | "q3" | "q4";
