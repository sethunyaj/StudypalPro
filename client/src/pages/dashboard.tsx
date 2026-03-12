import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, FileText, LogOut, Brain, Timer, Users, Target, BookOpen, Lightbulb, GraduationCap, Newspaper, ArrowLeft } from "lucide-react";
import DashboardOverview from "@/components/dashboard/overview";
import Notes from "@/components/dashboard/notes";
import Flashcards from "@/components/dashboard/flashcards";
import Quiz from "@/components/dashboard/quiz";
import Pomodoro from "@/components/dashboard/pomodoro";
import AITutor from "@/components/dashboard/ai-tutor";
import StudyPlanner from "@/components/dashboard/study-planner";
import Analytics from "@/components/dashboard/analytics";
import Achievements from "@/components/dashboard/achievements";
import StudyGroups from "@/components/dashboard/study-groups";
import MindMap from "@/components/dashboard/mind-map";
import FastBotsWidget from "@/components/chatbot/fastbots-widget";
import { ContactAdminChat } from "@/components/support/contact-admin-chat";
import logoPath from "@assets/Hibiscus StudyPal logo_1762337029890.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<any>(null);
  const [quizNoteId, setQuizNoteId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLocation("/");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setLocation("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="shadow-lg border overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-primary/10 via-chart-2/10 to-chart-3/10 border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Hibiscus StudyPal" className="h-12 w-auto" />
                <div>
                  <CardDescription className="text-sm">
                    Welcome back, <span className="font-semibold text-foreground">{user.name}</span>!
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50">
                  <Trophy className="h-4 w-4 text-chart-2" />
                  <span className="font-semibold text-sm">{user.points || 0} XP</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50">
                  <Flame className="h-4 w-4 text-chart-3" />
                  <span className="font-semibold text-sm">{user.streak || 0} days</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50">
                  <Target className="h-4 w-4 text-chart-1" />
                  <span className="font-semibold text-sm">Lvl {user.level || 1}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Navigation Tabs */}
          <div className="bg-card/30 border-b overflow-x-auto">
            <Tabs value={activeTab} onValueChange={(tab) => {
              setActiveTab(tab);
              if (tab !== "quiz") setQuizNoteId(null);
            }} className="w-full">
              <TabsList className="w-full justify-start rounded-none h-auto p-2 bg-transparent gap-1">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-card" data-testid="tab-overview">
                  <Trophy className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2 data-[state=active]:bg-card" data-testid="tab-notes">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Notes</span>
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="gap-2 data-[state=active]:bg-card" data-testid="tab-flashcards">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Flashcards</span>
                </TabsTrigger>
                <TabsTrigger value="quiz" className="gap-2 data-[state=active]:bg-card" data-testid="tab-quiz">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">Quiz</span>
                </TabsTrigger>
                <TabsTrigger value="pomodoro" className="gap-2 data-[state=active]:bg-card" data-testid="tab-pomodoro">
                  <Timer className="h-4 w-4" />
                  <span className="hidden sm:inline">Focus</span>
                </TabsTrigger>
                <TabsTrigger value="ai-tutor" className="gap-2 data-[state=active]:bg-card" data-testid="tab-ai-tutor">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Tutor</span>
                </TabsTrigger>
                <TabsTrigger value="mind-map" className="gap-2 data-[state=active]:bg-card" data-testid="tab-mind-map">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Mind Map</span>
                </TabsTrigger>
                <TabsTrigger value="groups" className="gap-2 data-[state=active]:bg-card" data-testid="tab-groups">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Groups</span>
                </TabsTrigger>
                <TabsTrigger value="classes" className="gap-2 data-[state=active]:bg-card" data-testid="tab-classes" onClick={() => setLocation("/classes")}>
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">My Classes</span>
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-2 data-[state=active]:bg-card" data-testid="tab-news" onClick={() => setLocation("/news")}>
                  <Newspaper className="h-4 w-4" />
                  <span className="hidden sm:inline">News</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content Area */}
          <CardContent className="p-6">
            {activeTab !== "overview" && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 gap-1.5"
                onClick={() => setActiveTab("overview")}
                data-testid="button-back-overview"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="overview" className="mt-0">
                <DashboardOverview user={user} onTabChange={setActiveTab} />
              </TabsContent>
              
              <TabsContent value="notes" className="mt-0">
                <Notes
                  userId={user.id}
                  onNavigateToQuiz={(noteId) => {
                    setQuizNoteId(noteId);
                    setActiveTab("quiz");
                  }}
                  onNavigateToFlashcards={() => setActiveTab("flashcards")}
                />
              </TabsContent>
              
              <TabsContent value="flashcards" className="mt-0">
                <Flashcards userId={user.id} />
              </TabsContent>
              
              <TabsContent value="quiz" className="mt-0">
                <Quiz userId={user.id} preSelectedNoteId={quizNoteId} />
              </TabsContent>
              
              <TabsContent value="pomodoro" className="mt-0">
                <Pomodoro userId={user.id} />
              </TabsContent>
              
              <TabsContent value="ai-tutor" className="mt-0">
                <AITutor userId={user.id} />
              </TabsContent>
              
              <TabsContent value="mind-map" className="mt-0">
                <MindMap userId={user.id} />
              </TabsContent>
              
              <TabsContent value="groups" className="mt-0">
                <StudyGroups userId={user.id} userName={user.name} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ContactAdminChat userId={user.id} userRole={user.role} userName={user.name} />
    </div>
  );
}
