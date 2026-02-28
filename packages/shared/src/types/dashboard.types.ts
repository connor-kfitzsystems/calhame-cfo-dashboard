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
