import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

interface StudyPlannerProps {
  userId: string;
}

export default function StudyPlanner({ userId }: StudyPlannerProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Study Planner</h2>
          <p className="text-sm text-muted-foreground">Plan your study schedule</p>
        </div>
        <Button data-testid="button-create-plan">
          <Plus className="h-4 w-4 mr-2" />
          New Study Plan
        </Button>
      </div>

      <Card className="p-12 text-center">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Study Planner Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          AI-powered study schedules based on your goals and availability
        </p>
      </Card>
    </div>
  );
}
