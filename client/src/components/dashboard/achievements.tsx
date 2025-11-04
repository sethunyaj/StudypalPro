import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Star } from "lucide-react";

interface AchievementsProps {
  userId: string;
}

export default function Achievements({ userId }: AchievementsProps) {
  const { data: achievements } = useQuery({
    queryKey: ['/api/achievements', userId],
  });

  const { data: progress } = useQuery({
    queryKey: ['/api/achievements/progress', userId],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Achievements</h2>
        <p className="text-sm text-muted-foreground">Track your accomplishments</p>
      </div>

      {achievements && achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement: any) => (
            <Card key={achievement.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{achievement.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {achievement.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
          <p className="text-sm text-muted-foreground">
            Start studying to unlock your first achievement!
          </p>
        </Card>
      )}
    </div>
  );
}
