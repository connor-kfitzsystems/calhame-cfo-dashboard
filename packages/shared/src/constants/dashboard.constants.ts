import { Quarter } from "../types";

export const QUARTER_OPTIONS: { key: Quarter; title: string; desc?: string }[] = [
  { key: "year", title: "Full Year" },
  { key: "q1", title: "Q1", desc: "Jan — Mar" },
  { key: "q2", title: "Q2", desc: "Apr — Jun" },
  { key: "q3", title: "Q3", desc: "Jul — Sep" },
  { key: "q4", title: "Q4", desc: "Oct — Dec" }
];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
