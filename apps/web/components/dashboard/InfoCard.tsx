import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cx } from "class-variance-authority";

interface InfoCardProps {
  title: string;
  value: string;
  info?: string;
  className?: string;
}

export default function InfoCard({ title, value, info, className }: InfoCardProps) {
  return (
    <Card className={cx(className, "gap-1 h-full")}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
      </CardContent>

      {info
        ? <CardFooter>
            <div className="text-sm text-muted-foreground">{info}</div>
          </CardFooter>
        : null
      }
    </Card>
  );
}
