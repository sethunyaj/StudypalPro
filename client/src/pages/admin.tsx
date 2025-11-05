import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Brain, FileText, LogOut, BarChart3, Settings } from "lucide-react";
import StudentManagement from "@/components/admin/student-management";
import ContentManagement from "@/components/admin/content-management";
import AdminAnalytics from "@/components/admin/admin-analytics";
import logoPath from "@assets/Hibiscus StudyPal logo_1762337029890.png";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("students");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLocation("/");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "admin") {
      setLocation("/dashboard");
      return;
    }
    setUser(parsedUser);
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setLocation("/");
  };

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen hibiscus-gradient">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="glass-effect shadow-2xl overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-chart-5/10 via-primary/10 to-chart-2/10 border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Hibiscus StudyPal" className="h-12 w-auto" />
                <div>
                  <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
                  <CardDescription className="text-sm">
                    Welcome, <span className="font-semibold text-foreground">{user.name}</span>
                  </CardDescription>
                </div>
              </div>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b bg-card/30">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Total Students</CardDescription>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Active Today</CardDescription>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeToday || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Quizzes Taken</CardDescription>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalQuizAttempts || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Avg Performance</CardDescription>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.avgPerformance || 0}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-card/30 border-b overflow-x-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none h-auto p-2 bg-transparent gap-1">
                <TabsTrigger value="students" className="gap-2 data-[state=active]:bg-card" data-testid="tab-students">
                  <Users className="h-4 w-4" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2 data-[state=active]:bg-card" data-testid="tab-content">
                  <FileText className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-card" data-testid="tab-analytics">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content Area */}
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="students" className="mt-0">
                <StudentManagement />
              </TabsContent>
              
              <TabsContent value="content" className="mt-0">
                <ContentManagement />
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-0">
                <AdminAnalytics />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
