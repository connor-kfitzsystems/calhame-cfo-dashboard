"use client";

import DashboardError from "@/components/dashboard/DashboardError";

import { useEffect } from "react";

interface DashboardErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <DashboardError reset={reset}/>;
}
