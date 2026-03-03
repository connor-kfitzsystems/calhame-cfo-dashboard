"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Quarter, QUARTER_OPTIONS } from "@repo/shared";
import Link from "next/link";

interface QuarterSelectionProps {
  value: Quarter;
  year: number;
}

export default function QuarterSelection({ value = "year", year }: QuarterSelectionProps) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
      {QUARTER_OPTIONS.map((opt) => {
        const selected = value === opt.key;

        return (
          <Link
            key={opt.key}
            href={`?quarter=${opt.key}&year=${year}`}
            className="block"
          >
            <Card
              tabIndex={0}
              aria-pressed={selected}
              className={cn(
                "relative cursor-pointer transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                selected
                  ? "border-2 border-primary/80 shadow-lg bg-gradient-to-b from-primary/5 to-transparent"
                  : "hover:shadow-md"
              )}
            >
            {selected && (
              <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}

            <CardHeader>
              <div>
                <CardTitle className={selected ? "font-semibold" : undefined}>{opt.title}</CardTitle>
                <CardDescription>{opt.desc}</CardDescription>
              </div>
            </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
