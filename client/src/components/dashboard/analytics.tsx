import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface AnalyticsProps {
  userId: string;
}

export default function Analytics({ userId }: AnalyticsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Deep dive into your learning progress</p>
      </div>

      <Card className="p-12 text-center">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          Detailed insights into your study patterns and performance trends
        </p>
      </Card>
    </div>
  );
}
