import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Target, BookOpen, Brain, Award } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardOverviewProps {
  user: any;
}

export default function DashboardOverview({ user }: DashboardOverviewProps) {
  const { data: stats } = useQuery({
    queryKey: ['/api/stats', user.id],
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['/api/activity/recent', user.id],
  });

  const { data: achievements } = useQuery({
    queryKey: ['/api/achievements', user.id],
  });

  // Calculate XP progress to next level
  const xpForNextLevel = user.level * 100;
  const xpProgress = ((user.xp || 0) / xpForNextLevel) * 100;

  // Chart data for activity
  const activityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Study Time (min)',
        data: stats?.weeklyActivity || [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'hsl(var(--chart-1))',
        backgroundColor: 'hsl(var(--chart-1) / 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Subject performance data
  const subjectData = {
    labels: stats?.subjectNames || ['Math', 'Science', 'English'],
    datasets: [
      {
        label: 'Performance',
        data: stats?.subjectScores || [75, 85, 90],
        backgroundColor: [
          'hsl(var(--chart-1) / 0.8)',
          'hsl(var(--chart-2) / 0.8)',
          'hsl(var(--chart-3) / 0.8)',
        ],
      },
    ],
  };

  const recentAchievements = achievements?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total XP</CardDescription>
              <Trophy className="h-5 w-5 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.points || 0}</div>
            <Progress value={xpProgress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {xpForNextLevel - (user.xp || 0)} XP to Level {user.level + 1}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Study Streak</CardDescription>
              <Flame className="h-5 w-5 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.streak || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {user.streak > 0 ? "Keep it up!" : "Start studying to build a streak!"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Quizzes Taken</CardDescription>
              <Brain className="h-5 w-5 text-chart-1" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalQuizzes || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Average Score: {stats?.avgScore || 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Study Time</CardDescription>
              <BookOpen className="h-5 w-5 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalStudyTime || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">Hours this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Activity</CardTitle>
            <CardDescription>Your study time over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line
                data={activityData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject Performance</CardTitle>
            <CardDescription>Your average scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={subjectData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-chart-2" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement: any) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-chart-2/10 to-chart-1/10 border border-chart-2/20"
                >
                  <div className="text-3xl">{achievement.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{achievement.title}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Jump into your study session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover-elevate active-elevate-2 bg-card border transition-all"
              data-testid="button-quick-quiz"
            >
              <Brain className="h-8 w-8 text-chart-1" />
              <span className="text-sm font-medium">Start Quiz</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover-elevate active-elevate-2 bg-card border transition-all"
              data-testid="button-quick-flashcards"
            >
              <BookOpen className="h-8 w-8 text-chart-2" />
              <span className="text-sm font-medium">Review Cards</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover-elevate active-elevate-2 bg-card border transition-all"
              data-testid="button-quick-pomodoro"
            >
              <Target className="h-8 w-8 text-chart-3" />
              <span className="text-sm font-medium">Focus Time</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover-elevate active-elevate-2 bg-card border transition-all"
              data-testid="button-quick-notes"
            >
              <BookOpen className="h-8 w-8 text-chart-4" />
              <span className="text-sm font-medium">Take Notes</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
