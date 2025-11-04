import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

export default function AdminAnalytics() {
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
  });

  const activityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Users',
        data: analytics?.weeklyActivity || [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'hsl(var(--chart-1))',
        backgroundColor: 'hsl(var(--chart-1) / 0.2)',
        tension: 0.4,
      },
    ],
  };

  const performanceData = {
    labels: ['Math', 'Science', 'English', 'History', 'Other'],
    datasets: [
      {
        label: 'Avg Score (%)',
        data: analytics?.subjectPerformance || [75, 82, 88, 79, 81],
        backgroundColor: [
          'hsl(var(--chart-1) / 0.8)',
          'hsl(var(--chart-2) / 0.8)',
          'hsl(var(--chart-3) / 0.8)',
          'hsl(var(--chart-4) / 0.8)',
          'hsl(var(--chart-5) / 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Monitor platform usage and student performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Activity</CardTitle>
            <CardDescription>Active users over the past week</CardDescription>
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
            <CardDescription>Average scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={performanceData}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalQuizzes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{analytics?.quizzesThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Study Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalStudyHours || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform-wide this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.engagementRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Daily active users
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
