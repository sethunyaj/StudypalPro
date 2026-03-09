import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  CheckCircle2,
  Circle,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";
import type { TrainingItem } from "@shared/schema";

interface TeacherProgressData {
  id: string;
  name: string;
  username: string;
  completedCount: number;
  totalItems: number;
  percentage: number;
  completions: { itemId: string; completedAt: string | null }[];
}

interface TeacherProgressProps {
  adminUserId: string;
}

export default function TeacherProgress({ adminUserId }: TeacherProgressProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProgressData | null>(null);

  const { data: teacherProgress = [], isLoading } = useQuery<TeacherProgressData[]>({
    queryKey: ["/api/training/progress/all-teachers", adminUserId],
    queryFn: async () => {
      const res = await fetch(`/api/training/progress/all-teachers?userId=${adminUserId}`);
      if (!res.ok) throw new Error("Failed to load teacher progress");
      return res.json();
    },
  });

  const { data: allItems = [] } = useQuery<TrainingItem[]>({
    queryKey: ["/api/training/items"],
  });

  const postedItems = allItems.filter(i => i.status === "posted");

  const avgProgress = teacherProgress.length > 0
    ? Math.round(teacherProgress.reduce((sum, t) => sum + t.percentage, 0) / teacherProgress.length)
    : 0;

  const fullyCompleted = teacherProgress.filter(t => t.percentage === 100).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading teacher progress...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-teachers">{teacherProgress.length}</p>
              <p className="text-xs text-muted-foreground">Total Teachers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-chart-2/10">
              <TrendingUp className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-avg-progress">{avgProgress}%</p>
              <p className="text-xs text-muted-foreground">Avg. Completion</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-chart-3/10">
              <Award className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-fully-completed">{fullyCompleted}</p>
              <p className="text-xs text-muted-foreground">Fully Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {teacherProgress.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No teachers registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Teacher Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {teacherProgress.map((teacher) => (
                <button
                  key={teacher.id}
                  className="w-full flex items-center gap-3 p-4 hover-elevate text-left"
                  onClick={() => setSelectedTeacher(teacher)}
                  data-testid={`row-teacher-${teacher.id}`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">@{teacher.username}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold" data-testid={`text-progress-${teacher.id}`}>
                        {teacher.completedCount}/{teacher.totalItems}
                      </p>
                      <p className="text-xs text-muted-foreground">{teacher.percentage}%</p>
                    </div>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          teacher.percentage === 100 ? 'bg-chart-2' :
                          teacher.percentage > 50 ? 'bg-primary' :
                          teacher.percentage > 0 ? 'bg-chart-3' : 'bg-muted'
                        }`}
                        style={{ width: `${teacher.percentage}%` }}
                      />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedTeacher} onOpenChange={(open) => { if (!open) setSelectedTeacher(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {selectedTeacher?.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selectedTeacher?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTeacher?.completedCount} of {selectedTeacher?.totalItems} items completed ({selectedTeacher?.percentage}%)
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              {postedItems.map((item) => {
                const completion = selectedTeacher.completions.find(c => c.itemId === item.id);
                const completed = !!completion;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-md"
                    data-testid={`progress-item-${item.id}`}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-chart-2 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${completed ? 'text-foreground' : 'text-muted-foreground'}`}>{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                    {completed && (
                      <Badge variant="secondary" className="text-xs shrink-0">Done</Badge>
                    )}
                  </div>
                );
              })}
              {postedItems.length === 0 && (
                <div className="text-center py-6">
                  <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No training items have been posted yet.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
