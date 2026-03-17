import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  LogOut, Plus, Users, BookOpen, Calendar, FileText, Link2, 
  CheckSquare, Clock, ArrowLeft, GraduationCap, ClipboardList,
  Trophy, Flame, Target, BookMarked, Trash2, ExternalLink, Upload,
  Download, File, Paperclip, Brain, Edit2, Eye, Grip, 
  Check, X, List, AlignLeft, CircleDot, ChevronRight, Sparkles
} from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { ContactAdminChat } from "@/components/support/contact-admin-chat";
import logoPath from "@assets/Hibiscus StudyPal logo_1762337029890.png";
import { TrainingHub } from "@/components/training/training-hub";
import { AILessonPlanner } from "@/components/teacher/ai-lesson-planner";
import type { Class, Todo, Exam, ClassResource, TeacherQuiz, TeacherQuizQuestion, QuestionType } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

type ClassWithTeacher = Class & { teacherName: string; studentCount?: number };
type TodoWithClass = Todo & { className: string; classSubject: string };
type ExamWithClass = Exam & { className: string; classSubject: string };

export default function ClassesPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<ClassWithTeacher | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLocation("/");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [setLocation]);

  const { data: classes = [], isLoading: classesLoading, refetch: refetchClasses } = useQuery<ClassWithTeacher[]>({
    queryKey: ["/api/classes/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: allTodos = [] } = useQuery<TodoWithClass[]>({
    queryKey: ["/api/todos/student", user?.id],
    enabled: !!user?.id && user?.role === "student",
  });

  const { data: allExams = [] } = useQuery<ExamWithClass[]>({
    queryKey: ["/api/exams/student", user?.id],
    enabled: !!user?.id && user?.role === "student",
  });

  const joinClassMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest("POST", "/api/classes/join", { code, studentId: user.id });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "You have joined the class!" });
      setShowJoinDialog(false);
      setJoinCode("");
      refetchClasses();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setLocation("/");
  };

  if (!user) return null;

  const isTeacher = user.role === "teacher";
  const isAdmin = user.role === "admin";
  const isTeacherOrAdmin = isTeacher || isAdmin;
  const upcomingExams = allExams.filter(e => new Date(e.date) >= new Date()).slice(0, 5);
  const dueSoonTodos = allTodos.filter(t => t.dueDate && new Date(t.dueDate) >= new Date()).slice(0, 5);

  if (selectedClass) {
    return (
      <ClassDashboard 
        classData={selectedClass} 
        user={user} 
        onBack={() => setSelectedClass(null)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="shadow-lg border overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-chart-2/10 to-chart-3/10 border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Hibiscus StudyPal" className="h-12 w-auto" />
                <div>
                  <CardTitle className="text-lg">My Classes</CardTitle>
                  <CardDescription className="text-sm">
                    {isTeacherOrAdmin ? "Manage your classes and students" : "View your enrolled classes"}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {isAdmin ? "Admin" : isTeacher ? "Teacher" : "Student"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setLocation(isAdmin ? "/admin" : "/dashboard")} data-testid="button-back-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
                <Button variant="destructive" size="sm" onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Your Classes</h2>
                  <div className="flex gap-2">
                    {isTeacherOrAdmin ? (
                      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid="button-create-class">
                            <Plus className="h-4 w-4 mr-1" />
                            Create Class
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <CreateClassForm 
                            teacherId={user.id} 
                            onSuccess={() => {
                              setShowCreateDialog(false);
                              refetchClasses();
                            }} 
                          />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid="button-join-class">
                            <Plus className="h-4 w-4 mr-1" />
                            Join Class
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Join a Class</DialogTitle>
                            <DialogDescription>
                              Enter the class code provided by your teacher
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="class-code">Class Code</Label>
                              <Input 
                                id="class-code" 
                                placeholder="e.g., ABC123" 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="uppercase"
                                data-testid="input-class-code"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => joinClassMutation.mutate(joinCode)}
                              disabled={!joinCode.trim() || joinClassMutation.isPending}
                              data-testid="button-submit-join"
                            >
                              {joinClassMutation.isPending ? "Joining..." : "Join Class"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                {classesLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-6 bg-muted rounded mb-2 w-3/4" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : classes.length === 0 ? (
                  <Card className="border">
                    <CardContent className="p-8 text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {isTeacherOrAdmin 
                          ? "Create your first class to get started" 
                          : "Join a class using the code from your teacher"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {classes.map((cls) => (
                      <ClassCard 
                        key={cls.id} 
                        classData={cls} 
                        onClick={() => setSelectedClass(cls)}
                        isTeacher={isTeacherOrAdmin}
                      />
                    ))}
                  </div>
                )}
              </div>

              {!isTeacherOrAdmin && (
                <div className="space-y-6">
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-chart-2" />
                        Upcoming Deadlines
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dueSoonTodos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No upcoming to-dos</p>
                      ) : (
                        dueSoonTodos.map((todo) => (
                          <div key={todo.id} className="flex items-start gap-3 text-sm">
                            <CheckSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium line-clamp-1">{todo.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {todo.className} &bull; {todo.dueDate && format(new Date(todo.dueDate), "MMM d")}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-chart-3" />
                        Upcoming Exams
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {upcomingExams.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No upcoming exams</p>
                      ) : (
                        upcomingExams.map((exam) => (
                          <div key={exam.id} className="flex items-start gap-3 text-sm">
                            <ClipboardList className="h-4 w-4 text-chart-3 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium line-clamp-1">{exam.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {exam.className} &bull; {format(new Date(exam.date), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {isTeacherOrAdmin && (
              <div className="mt-6 space-y-6">
                <Card className="border">
                  <CardContent className="p-6">
                    <AILessonPlanner />
                  </CardContent>
                </Card>
                <TrainingHub userId={user.id} userRole={user.role} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isAdmin && (
        <ContactAdminChat userId={user.id} userRole={user.role} userName={user.name} />
      )}
    </div>
  );
}

function ClassCard({ classData, onClick, isTeacher }: { 
  classData: ClassWithTeacher; 
  onClick: () => void;
  isTeacher: boolean;
}) {
  const colorMap: Record<string, string> = {
    "bg-primary": "from-primary/20 to-primary/5 border-primary/30",
    "bg-chart-2": "from-chart-2/20 to-chart-2/5 border-chart-2/30",
    "bg-chart-3": "from-chart-3/20 to-chart-3/5 border-chart-3/30",
    "bg-blue-500": "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    "bg-purple-500": "from-purple-500/20 to-purple-500/5 border-purple-500/30",
  };
  
  const gradientClass = colorMap[classData.color] || colorMap["bg-primary"];

  return (
    <Card 
      className={`border hover-elevate cursor-pointer transition-all bg-gradient-to-br ${gradientClass} border`}
      onClick={onClick}
      data-testid={`card-class-${classData.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold line-clamp-1">{classData.name}</h3>
            <p className="text-sm text-muted-foreground">{classData.subject}</p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {classData.code}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {classData.description || "No description"}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {isTeacher ? `${classData.studentCount || 0} students` : classData.teacherName}
          </span>
          <Button size="sm" variant="ghost" className="h-7 text-xs" data-testid={`button-view-class-${classData.id}`}>
            View Class
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassDashboard({ classData, user, onBack, onLogout }: {
  classData: ClassWithTeacher;
  user: any;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState("todos");
  const isTeacher = user.role === "teacher";

  const { data: todos = [], refetch: refetchTodos } = useQuery<Todo[]>({
    queryKey: ["/api/classes", classData.id, "todos"],
  });

  const { data: exams = [], refetch: refetchExams } = useQuery<Exam[]>({
    queryKey: ["/api/classes", classData.id, "exams"],
  });

  const { data: resources = [], refetch: refetchResources } = useQuery<ClassResource[]>({
    queryKey: ["/api/classes", classData.id, "resources"],
  });

  const { data: students = [], refetch: refetchStudents } = useQuery<any[]>({
    queryKey: ["/api/classes", classData.id, "students"],
    enabled: isTeacher,
  });

  const { data: teacherQuizzes = [], refetch: refetchQuizzes } = useQuery<TeacherQuiz[]>({
    queryKey: ["/api/classes", classData.id, "teacher-quizzes"],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="shadow-lg border overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-chart-2/10 to-chart-3/10 border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-classes">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-lg">{classData.name}</CardTitle>
                  <CardDescription className="text-sm flex items-center gap-2">
                    <span>{classData.subject}</span>
                    <Badge variant="outline" className="text-xs">{classData.code}</Badge>
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isTeacher && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {students.length} students
                  </Badge>
                )}
                <Button variant="destructive" size="sm" onClick={onLogout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>

          <div className="bg-card/30 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start rounded-none h-auto p-2 bg-transparent gap-1">
                <TabsTrigger value="todos" className="gap-2 data-[state=active]:bg-card" data-testid="tab-todos">
                  <CheckSquare className="h-4 w-4" />
                  To-Do List
                </TabsTrigger>
                <TabsTrigger value="exams" className="gap-2 data-[state=active]:bg-card" data-testid="tab-exams">
                  <Calendar className="h-4 w-4" />
                  Exams
                </TabsTrigger>
                <TabsTrigger value="resources" className="gap-2 data-[state=active]:bg-card" data-testid="tab-resources">
                  <FileText className="h-4 w-4" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="gap-2 data-[state=active]:bg-card" data-testid="tab-quizzes">
                  <Brain className="h-4 w-4" />
                  Quizzes
                </TabsTrigger>
                {isTeacher && (
                  <>
                    <TabsTrigger value="ai-planner" className="gap-2 data-[state=active]:bg-card" data-testid="tab-ai-planner">
                      <Sparkles className="h-4 w-4" />
                      AI Planner
                    </TabsTrigger>
                    <TabsTrigger value="students" className="gap-2 data-[state=active]:bg-card" data-testid="tab-students">
                      <Users className="h-4 w-4" />
                      Students
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </Tabs>
          </div>

          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="todos" className="mt-0">
                <TodosTab 
                  classId={classData.id} 
                  todos={todos} 
                  isTeacher={isTeacher} 
                  userId={user.id}
                  onRefresh={refetchTodos}
                />
              </TabsContent>
              
              <TabsContent value="exams" className="mt-0">
                <ExamsTab 
                  classId={classData.id} 
                  exams={exams} 
                  isTeacher={isTeacher} 
                  userId={user.id}
                  onRefresh={refetchExams}
                />
              </TabsContent>
              
              <TabsContent value="resources" className="mt-0">
                <ResourcesTab 
                  classId={classData.id} 
                  resources={resources} 
                  isTeacher={isTeacher} 
                  userId={user.id}
                  onRefresh={refetchResources}
                />
              </TabsContent>

              <TabsContent value="quizzes" className="mt-0">
                <QuizzesTab 
                  classId={classData.id}
                  quizzes={teacherQuizzes}
                  isTeacher={isTeacher}
                  userId={user.id}
                  onRefresh={refetchQuizzes}
                />
              </TabsContent>

              {isTeacher && (
                <>
                  <TabsContent value="ai-planner" className="mt-0">
                    <AILessonPlanner defaultSubject={classData.subject} />
                  </TabsContent>
                  <TabsContent value="students" className="mt-0">
                    <StudentsTab 
                      students={students as any[]} 
                      classId={classData.id} 
                      onRefresh={refetchStudents}
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CreateClassForm({ teacherId, onSuccess }: { teacherId: string; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("bg-primary");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/classes", {
        name,
        subject,
        description,
        teacherId,
        color,
        code: "", 
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Class Created!", 
        description: `Share this code with your students: ${data.code}` 
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Class</DialogTitle>
        <DialogDescription>
          Set up a new class for your students
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="class-name">Class Name</Label>
          <Input 
            id="class-name" 
            placeholder="e.g., AP Biology Period 3" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-class-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input 
            id="subject" 
            placeholder="e.g., Biology" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            data-testid="input-subject"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea 
            id="description" 
            placeholder="Brief description of the class..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="input-description"
          />
        </div>
        <div className="space-y-2">
          <Label>Color Theme</Label>
          <div className="flex gap-2">
            {["bg-primary", "bg-chart-2", "bg-chart-3", "bg-blue-500", "bg-purple-500"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full ${c} ${color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                data-testid={`button-color-${c}`}
              />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button 
          onClick={() => createMutation.mutate()}
          disabled={!name.trim() || !subject.trim() || createMutation.isPending}
          data-testid="button-submit-create"
        >
          {createMutation.isPending ? "Creating..." : "Create Class"}
        </Button>
      </DialogFooter>
    </>
  );
}

function TodosTab({ classId, todos, isTeacher, userId, onRefresh }: {
  classId: string;
  todos: Todo[];
  isTeacher: boolean;
  userId: string;
  onRefresh: () => void;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/classes/${classId}/todos`, {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        resourceLink: resourceLink || null,
        createdBy: userId,
      });
    },
    onSuccess: () => {
      toast({ title: "To-do added!" });
      setShowAddDialog(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setResourceLink("");
      onRefresh();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (todoId: string) => {
      return await apiRequest("DELETE", `/api/todos/${todoId}`);
    },
    onSuccess: () => {
      toast({ title: "To-do deleted" });
      onRefresh();
    },
  });

  const getDueStatus = (dueDate: Date | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "overdue";
    if (isToday(date)) return "today";
    if (isTomorrow(date)) return "tomorrow";
    return "upcoming";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assignments & To-Do Items</h3>
        {isTeacher && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-todo">
                <Plus className="h-4 w-4 mr-1" />
                Add To-Do
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add To-Do Item</DialogTitle>
                <DialogDescription>Create an assignment or task for your students</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g., Read Chapter 5" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-todo-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea 
                    placeholder="Additional details..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-todo-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date (Optional)</Label>
                  <Input 
                    type="datetime-local" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    data-testid="input-todo-due-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resource Link (Optional)</Label>
                  <Input 
                    placeholder="https://..." 
                    value={resourceLink}
                    onChange={(e) => setResourceLink(e.target.value)}
                    data-testid="input-todo-resource-link"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => addMutation.mutate()}
                  disabled={!title.trim() || addMutation.isPending}
                  data-testid="button-submit-todo"
                >
                  {addMutation.isPending ? "Adding..." : "Add To-Do"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {todos.length === 0 ? (
        <Card className="border">
          <CardContent className="p-8 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isTeacher ? "No to-do items yet. Add one to get started!" : "No assignments yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todos.map((todo) => {
            const status = getDueStatus(todo.dueDate);
            return (
              <Card key={todo.id} className="border" data-testid={`todo-item-${todo.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{todo.title}</h4>
                        {status === "overdue" && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                        {status === "today" && (
                          <Badge variant="default" className="text-xs bg-chart-2">Due Today</Badge>
                        )}
                        {status === "tomorrow" && (
                          <Badge variant="outline" className="text-xs">Due Tomorrow</Badge>
                        )}
                      </div>
                      {todo.description && (
                        <p className="text-sm text-muted-foreground mb-2">{todo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {todo.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(todo.dueDate), "MMM d, h:mm a")}
                          </span>
                        )}
                        {todo.resourceLink && (
                          <a 
                            href={todo.resourceLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Link2 className="h-3 w-3" />
                            Resource
                          </a>
                        )}
                      </div>
                    </div>
                    {isTeacher && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteMutation.mutate(todo.id)}
                        data-testid={`button-delete-todo-${todo.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExamsTab({ classId, exams, isTeacher, userId, onRefresh }: {
  classId: string;
  exams: Exam[];
  isTeacher: boolean;
  userId: string;
  onRefresh: () => void;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [topics, setTopics] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; path: string }>>([]);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/classes/${classId}/exams`, {
        title,
        description,
        date: new Date(date).toISOString(),
        topics: topics.split(",").map(t => t.trim()).filter(Boolean),
        attachments: attachments.map(a => JSON.stringify(a)),
        createdBy: userId,
      });
    },
    onSuccess: () => {
      toast({ title: "Exam added!" });
      setShowAddDialog(false);
      setTitle("");
      setDescription("");
      setDate("");
      setTopics("");
      setAttachments([]);
      onRefresh();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (examId: string) => {
      return await apiRequest("DELETE", `/api/exams/${examId}`);
    },
    onSuccess: () => {
      toast({ title: "Exam deleted" });
      onRefresh();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upcoming Exams & Tests</h3>
        {isTeacher && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-exam">
                <Plus className="h-4 w-4 mr-1" />
                Add Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Exam</DialogTitle>
                <DialogDescription>Schedule an exam or test for your class</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g., Midterm Exam" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-exam-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea 
                    placeholder="What's covered on the exam..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-exam-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    data-testid="input-exam-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Topics (comma-separated)</Label>
                  <Input 
                    placeholder="e.g., Chapter 1, Chapter 2, Vocabulary" 
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    data-testid="input-exam-topics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attachments (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload exam papers, revision guides, or timetables
                  </p>
                  {attachments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                          <File className="h-4 w-4 text-primary" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <ObjectUploader
                    onUploadComplete={(file) => {
                      setAttachments(prev => [...prev, file]);
                      toast({ title: "File uploaded!" });
                    }}
                    allowedFileTypes={[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"]}
                    buttonVariant="outline"
                    buttonSize="sm"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach File
                  </ObjectUploader>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => addMutation.mutate()}
                  disabled={!title.trim() || !date || addMutation.isPending}
                  data-testid="button-submit-exam"
                >
                  {addMutation.isPending ? "Adding..." : "Add Exam"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {exams.length === 0 ? (
        <Card className="border">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isTeacher ? "No exams scheduled. Add one to help students prepare!" : "No upcoming exams."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const examDate = new Date(exam.date);
            const isPastExam = isPast(examDate);
            return (
              <Card key={exam.id} className={`border ${isPastExam ? "opacity-60" : ""}`} data-testid={`exam-item-${exam.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{exam.title}</h4>
                        {isPastExam ? (
                          <Badge variant="secondary" className="text-xs">Completed</Badge>
                        ) : isToday(examDate) ? (
                          <Badge variant="destructive" className="text-xs">Today</Badge>
                        ) : null}
                      </div>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground mb-2">{exam.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{format(examDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                      {exam.topics && exam.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {exam.topics.map((topic, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {exam.attachments && exam.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            Attachments:
                          </span>
                          {exam.attachments.map((attachment, i) => {
                            try {
                              const file = typeof attachment === 'string' ? JSON.parse(attachment) : attachment;
                              const downloadUrl = file.path?.startsWith('/objects/') 
                                ? `/api/objects/download?path=${encodeURIComponent(file.path)}`
                                : file.path;
                              return (
                                <a 
                                  key={i}
                                  href={downloadUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                                  data-testid={`exam-attachment-download-${exam.id}-${i}`}
                                >
                                  <Download className="h-3 w-3" />
                                  {file.name}
                                  {file.size && (
                                    <span className="text-muted-foreground">
                                      ({formatFileSize(file.size)})
                                    </span>
                                  )}
                                </a>
                              );
                            } catch {
                              return null;
                            }
                          })}
                        </div>
                      )}
                    </div>
                    {isTeacher && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteMutation.mutate(exam.id)}
                        data-testid={`button-delete-exam-${exam.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResourcesTab({ classId, resources, isTeacher, userId, onRefresh }: {
  classId: string;
  resources: ClassResource[];
  isTeacher: boolean;
  userId: string;
  onRefresh: () => void;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("link");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; path: string } | null>(null);
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/classes/${classId}/resources`, {
        title,
        description,
        type,
        url: type === "link" ? url : null,
        content: type === "text" ? content : null,
        topic: topic || null,
        fileName: type === "file" && uploadedFile ? uploadedFile.name : null,
        filePath: type === "file" && uploadedFile ? uploadedFile.path : null,
        fileSize: type === "file" && uploadedFile ? uploadedFile.size : null,
        uploadedBy: userId,
      });
    },
    onSuccess: () => {
      toast({ title: "Resource added!" });
      setShowAddDialog(false);
      setTitle("");
      setDescription("");
      setType("link");
      setUrl("");
      setContent("");
      setTopic("");
      setUploadedFile(null);
      onRefresh();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      return await apiRequest("DELETE", `/api/resources/${resourceId}`);
    },
    onSuccess: () => {
      toast({ title: "Resource deleted" });
      onRefresh();
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "link": return <Link2 className="h-4 w-4" />;
      case "text": return <FileText className="h-4 w-4" />;
      case "file": return <File className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Class Resources</h3>
        {isTeacher && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-resource">
                <Plus className="h-4 w-4 mr-1" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Resource</DialogTitle>
                <DialogDescription>Share helpful materials with your students</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g., Study Guide Chapter 5" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-resource-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => { setType(v); setUploadedFile(null); }}>
                    <SelectTrigger data-testid="select-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="text">Text/Notes</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {type === "link" && (
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input 
                      placeholder="https://..." 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      data-testid="input-resource-url"
                    />
                  </div>
                )}
                {type === "text" && (
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea 
                      placeholder="Notes or study material..." 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={5}
                      data-testid="input-resource-content"
                    />
                  </div>
                )}
                {type === "file" && (
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    {uploadedFile ? (
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                        <File className="h-5 w-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setUploadedFile(null)}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <ObjectUploader
                        onUploadComplete={(file) => {
                          setUploadedFile(file);
                          if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
                          toast({ title: "File uploaded successfully!" });
                        }}
                        allowedFileTypes={[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".gif"]}
                        buttonVariant="outline"
                        buttonClassName="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select File to Upload
                      </ObjectUploader>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Supported: PDF, Word, PowerPoint, Excel, Images (max 50MB)
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input 
                    placeholder="Brief description..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-resource-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Topic (Optional)</Label>
                  <Input 
                    placeholder="e.g., Chapter 5" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    data-testid="input-resource-topic"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => addMutation.mutate()}
                  disabled={!title.trim() || (type === "link" && !url.trim()) || (type === "text" && !content.trim()) || (type === "file" && !uploadedFile) || addMutation.isPending}
                  data-testid="button-submit-resource"
                >
                  {addMutation.isPending ? "Adding..." : "Add Resource"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {resources.length === 0 ? (
        <Card className="border">
          <CardContent className="p-8 text-center">
            <BookMarked className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isTeacher ? "No resources yet. Add study materials for your students!" : "No resources available yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {resources.map((resource) => (
            <Card key={resource.id} className="border" data-testid={`resource-item-${resource.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(resource.type)}
                      <h4 className="font-medium">{resource.title}</h4>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                    )}
                    {resource.topic && (
                      <Badge variant="outline" className="text-xs mb-2">{resource.topic}</Badge>
                    )}
                    {resource.type === "link" && resource.url && (
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open Link
                      </a>
                    )}
                    {resource.type === "text" && resource.content && (
                      <p className="text-sm bg-muted/50 p-2 rounded mt-2 line-clamp-3">
                        {resource.content}
                      </p>
                    )}
                    {resource.type === "file" && resource.filePath && (
                      <div className="mt-2">
                        <a 
                          href={resource.filePath.startsWith('/objects/') 
                            ? `/api/objects/download?path=${encodeURIComponent(resource.filePath)}`
                            : resource.filePath
                          } 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                          data-testid={`resource-download-${resource.id}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {resource.fileName || "Download File"}
                          {resource.fileSize && (
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(resource.fileSize)})
                            </span>
                          )}
                        </a>
                      </div>
                    )}
                  </div>
                  {isTeacher && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(resource.id)}
                      data-testid={`button-delete-resource-${resource.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizzesTab({ classId, quizzes, isTeacher, userId, onRefresh }: { 
  classId: string; 
  quizzes: TeacherQuiz[]; 
  isTeacher: boolean; 
  userId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<TeacherQuiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<TeacherQuiz | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      return await apiRequest("DELETE", `/api/teacher-quizzes/${quizId}`);
    },
    onSuccess: () => {
      toast({ title: "Quiz deleted", description: "The quiz has been removed" });
      onRefresh();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ quizId, isPublished }: { quizId: string; isPublished: boolean }) => {
      return await apiRequest("PUT", `/api/teacher-quizzes/${quizId}`, { isPublished });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quiz status updated" });
      onRefresh();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (editingQuiz || showCreateDialog) {
    return (
      <QuizBuilder
        classId={classId}
        teacherId={userId}
        existingQuiz={editingQuiz || undefined}
        onSave={() => {
          setEditingQuiz(null);
          setShowCreateDialog(false);
          onRefresh();
        }}
        onCancel={() => {
          setEditingQuiz(null);
          setShowCreateDialog(false);
        }}
      />
    );
  }

  if (selectedQuiz) {
    return (
      <QuizDetails
        quiz={selectedQuiz}
        isTeacher={isTeacher}
        userId={userId}
        onBack={() => setSelectedQuiz(null)}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold">
          {isTeacher ? `Class Quizzes (${quizzes.length})` : `Available Quizzes (${quizzes.filter(q => q.isPublished).length})`}
        </h3>
        {isTeacher && (
          <Button size="sm" onClick={() => setShowCreateDialog(true)} data-testid="button-create-quiz">
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        )}
      </div>

      {(isTeacher ? quizzes : quizzes.filter(q => q.isPublished)).length === 0 ? (
        <Card className="border">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isTeacher ? "No quizzes created yet. Create your first quiz!" : "No quizzes available yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(isTeacher ? quizzes : quizzes.filter(q => q.isPublished)).map((quiz) => {
            const questions = quiz.questions as TeacherQuizQuestion[];
            return (
              <Card key={quiz.id} className="border" data-testid={`quiz-card-${quiz.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{quiz.title}</h4>
                        {isTeacher && (
                          <Badge variant={quiz.isPublished ? "default" : "secondary"} className="text-xs shrink-0">
                            {quiz.isPublished ? "Published" : "Draft"}
                          </Badge>
                        )}
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{quiz.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <List className="h-3 w-3" />
                          {questions?.length || 0} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {quiz.totalPoints} pts
                        </span>
                        {quiz.timeLimit && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {quiz.timeLimit} min
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedQuiz(quiz)}
                        data-testid={`button-view-quiz-${quiz.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isTeacher && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingQuiz(quiz)}
                            data-testid={`button-edit-quiz-${quiz.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(quiz.id)}
                            data-testid={`button-delete-quiz-${quiz.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {isTeacher && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        {quiz.isPublished ? "Visible to students" : "Hidden from students"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`publish-${quiz.id}`} className="text-xs">Publish</Label>
                        <Switch
                          id={`publish-${quiz.id}`}
                          checked={quiz.isPublished}
                          onCheckedChange={(checked) => 
                            togglePublishMutation.mutate({ quizId: quiz.id, isPublished: checked })
                          }
                          data-testid={`switch-publish-${quiz.id}`}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuizBuilder({ classId, teacherId, existingQuiz, onSave, onCancel }: {
  classId: string;
  teacherId: string;
  existingQuiz?: TeacherQuiz;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(existingQuiz?.title || "");
  const [description, setDescription] = useState(existingQuiz?.description || "");
  const [timeLimit, setTimeLimit] = useState<string>(existingQuiz?.timeLimit?.toString() || "");
  const [passingScore, setPassingScore] = useState<string>(existingQuiz?.passingScore?.toString() || "");
  const [questions, setQuestions] = useState<TeacherQuizQuestion[]>(
    (existingQuiz?.questions as TeacherQuizQuestion[]) || []
  );

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        description: description || null,
        teacherId,
        questions,
        totalPoints,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        passingScore: passingScore ? parseInt(passingScore) : null,
        isPublished: false,
      };

      if (existingQuiz) {
        return await apiRequest("PUT", `/api/teacher-quizzes/${existingQuiz.id}`, data);
      }
      return await apiRequest("POST", `/api/classes/${classId}/teacher-quizzes`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: existingQuiz ? "Quiz updated!" : "Quiz created!" });
      onSave();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addQuestion = (type: QuestionType) => {
    const baseQuestion = {
      id: crypto.randomUUID(),
      question: "",
      points: 1,
    };

    let newQuestion: TeacherQuizQuestion;
    switch (type) {
      case "mcq":
        newQuestion = { ...baseQuestion, type: "mcq", options: ["", "", "", ""], correctAnswer: 0 };
        break;
      case "multiple_select":
        newQuestion = { ...baseQuestion, type: "multiple_select", options: ["", "", "", ""], correctAnswers: [] };
        break;
      case "short_answer":
        newQuestion = { ...baseQuestion, type: "short_answer", acceptedAnswers: [] };
        break;
      case "essay":
        newQuestion = { ...baseQuestion, type: "essay", rubric: "", maxWords: undefined };
        break;
    }
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<TeacherQuizQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates } as TeacherQuizQuestion;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "mcq": return <CircleDot className="h-4 w-4" />;
      case "multiple_select": return <CheckSquare className="h-4 w-4" />;
      case "short_answer": return <AlignLeft className="h-4 w-4" />;
      case "essay": return <FileText className="h-4 w-4" />;
    }
  };

  const getQuestionTypeName = (type: QuestionType) => {
    switch (type) {
      case "mcq": return "Multiple Choice";
      case "multiple_select": return "Multiple Select";
      case "short_answer": return "Short Answer";
      case "essay": return "Essay";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-semibold">
            {existingQuiz ? "Edit Quiz" : "Create Quiz"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            disabled={!title.trim() || questions.length === 0 || createMutation.isPending}
            data-testid="button-save-quiz"
          >
            {createMutation.isPending ? "Saving..." : "Save Quiz"}
          </Button>
        </div>
      </div>

      <Card className="border">
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiz-title">Quiz Title *</Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
                data-testid="input-quiz-title"
              />
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="time-limit">Time Limit (min)</Label>
                <Input
                  id="time-limit"
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="Optional"
                  data-testid="input-time-limit"
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="passing-score">Passing Score (%)</Label>
                <Input
                  id="passing-score"
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  placeholder="Optional"
                  data-testid="input-passing-score"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-description">Description</Label>
            <Textarea
              id="quiz-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              data-testid="input-quiz-description"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h4 className="font-medium">Questions ({questions.length}) - Total: {totalPoints} points</h4>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => addQuestion("mcq")} data-testid="button-add-mcq">
              <CircleDot className="h-4 w-4 mr-1" /> MCQ
            </Button>
            <Button size="sm" variant="outline" onClick={() => addQuestion("multiple_select")} data-testid="button-add-multiselect">
              <CheckSquare className="h-4 w-4 mr-1" /> Multi-Select
            </Button>
            <Button size="sm" variant="outline" onClick={() => addQuestion("short_answer")} data-testid="button-add-shortanswer">
              <AlignLeft className="h-4 w-4 mr-1" /> Short Answer
            </Button>
            <Button size="sm" variant="outline" onClick={() => addQuestion("essay")} data-testid="button-add-essay">
              <FileText className="h-4 w-4 mr-1" /> Essay
            </Button>
          </div>
        </div>

        {questions.length === 0 ? (
          <Card className="border">
            <CardContent className="p-8 text-center">
              <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No questions yet. Add your first question using the buttons above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <Card key={q.id} className="border" data-testid={`question-card-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 pt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveQuestion(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronRight className="h-4 w-4 -rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveQuestion(index, "down")}
                        disabled={index === questions.length - 1}
                      >
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </Button>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            {getQuestionTypeIcon(q.type)}
                            {getQuestionTypeName(q.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">Q{index + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`points-${q.id}`} className="text-xs">Points:</Label>
                            <Input
                              id={`points-${q.id}`}
                              type="number"
                              min="1"
                              className="w-16 h-8"
                              value={q.points}
                              onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeQuestion(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(index, { question: e.target.value })}
                        placeholder="Enter your question..."
                        rows={2}
                        data-testid={`input-question-${index}`}
                      />

                      {(q.type === "mcq" || q.type === "multiple_select") && (
                        <div className="space-y-2">
                          <Label className="text-sm">Answer Options:</Label>
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              {q.type === "mcq" ? (
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctAnswer === optIndex}
                                  onChange={() => updateQuestion(index, { correctAnswer: optIndex })}
                                  className="w-4 h-4"
                                />
                              ) : (
                                <Checkbox
                                  checked={q.correctAnswers.includes(optIndex)}
                                  onCheckedChange={(checked) => {
                                    const newCorrect = checked
                                      ? [...q.correctAnswers, optIndex]
                                      : q.correctAnswers.filter(i => i !== optIndex);
                                    updateQuestion(index, { correctAnswers: newCorrect });
                                  }}
                                />
                              )}
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...q.options];
                                  newOptions[optIndex] = e.target.value;
                                  updateQuestion(index, { options: newOptions });
                                }}
                                placeholder={`Option ${optIndex + 1}`}
                                className="flex-1"
                              />
                              {q.options.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const newOptions = q.options.filter((_, i) => i !== optIndex);
                                    const updates: any = { options: newOptions };
                                    if (q.type === "mcq" && q.correctAnswer >= newOptions.length) {
                                      updates.correctAnswer = 0;
                                    }
                                    if (q.type === "multiple_select") {
                                      updates.correctAnswers = q.correctAnswers
                                        .filter(i => i !== optIndex)
                                        .map(i => i > optIndex ? i - 1 : i);
                                    }
                                    updateQuestion(index, updates);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuestion(index, { options: [...q.options, ""] })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Option
                          </Button>
                        </div>
                      )}

                      {q.type === "short_answer" && (
                        <div className="space-y-2">
                          <Label className="text-sm">Accepted Answers (for auto-grading):</Label>
                          <Input
                            value={q.acceptedAnswers?.join(", ") || ""}
                            onChange={(e) => updateQuestion(index, { 
                              acceptedAnswers: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                            })}
                            placeholder="Enter accepted answers separated by commas"
                          />
                          <p className="text-xs text-muted-foreground">
                            Leave empty for manual grading only
                          </p>
                        </div>
                      )}

                      {q.type === "essay" && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Grading Rubric (optional):</Label>
                            <Textarea
                              value={q.rubric || ""}
                              onChange={(e) => updateQuestion(index, { rubric: e.target.value })}
                              placeholder="Enter grading guidelines..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Max Words (optional):</Label>
                            <Input
                              type="number"
                              value={q.maxWords || ""}
                              onChange={(e) => updateQuestion(index, { maxWords: parseInt(e.target.value) || undefined })}
                              placeholder="No limit"
                              className="w-32"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Essay questions require manual grading
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizDetails({ quiz, isTeacher, userId, onBack, onRefresh }: {
  quiz: TeacherQuiz;
  isTeacher: boolean;
  userId: string;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const questions = quiz.questions as TeacherQuizQuestion[];
  const [takingQuiz, setTakingQuiz] = useState(false);

  const { data: existingAttempt } = useQuery({
    queryKey: ["/api/teacher-quizzes", quiz.id, "attempts", userId],
    enabled: !isTeacher,
  });

  const { data: allAttempts = [] } = useQuery({
    queryKey: ["/api/teacher-quizzes", quiz.id, "attempts"],
    enabled: isTeacher,
  });

  if (takingQuiz && !isTeacher && !existingAttempt) {
    return (
      <TakeQuiz
        quiz={quiz}
        studentId={userId}
        onComplete={() => {
          setTakingQuiz(false);
          onRefresh();
        }}
        onCancel={() => setTakingQuiz(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-sm text-muted-foreground">{quiz.description}</p>
            )}
          </div>
        </div>
        {!isTeacher && !existingAttempt && quiz.isPublished && (
          <Button onClick={() => setTakingQuiz(true)} data-testid="button-take-quiz">
            <Brain className="h-4 w-4 mr-2" />
            Take Quiz
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline" className="gap-1">
          <List className="h-3 w-3" />
          {questions.length} questions
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Target className="h-3 w-3" />
          {quiz.totalPoints} points
        </Badge>
        {quiz.timeLimit && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {quiz.timeLimit} minutes
          </Badge>
        )}
        {quiz.passingScore && (
          <Badge variant="outline" className="gap-1">
            <Check className="h-3 w-3" />
            {quiz.passingScore}% to pass
          </Badge>
        )}
      </div>

      {!isTeacher && existingAttempt && (
        <Card className="border bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Quiz Completed</p>
                <p className="text-sm text-muted-foreground">
                  Score: {(existingAttempt as any).totalScore || (existingAttempt as any).autoScore || 0} / {quiz.totalPoints} points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isTeacher && (
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Student Submissions ({(allAttempts as any[]).length})</CardTitle>
          </CardHeader>
          <CardContent>
            {(allAttempts as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            ) : (
              <div className="space-y-2">
                {(allAttempts as any[]).map((attempt: any) => (
                  <div key={attempt.id} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <p className="font-medium text-sm">{attempt.studentName}</p>
                      <p className="text-xs text-muted-foreground">@{attempt.studentUsername}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={attempt.status === "graded" ? "default" : "secondary"}>
                        {attempt.status === "graded" ? `${attempt.totalScore}/${quiz.totalPoints}` : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h4 className="font-medium">Questions Preview</h4>
        {questions.map((q, index) => (
          <Card key={q.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground">Q{index + 1}.</span>
                <div className="flex-1">
                  <p className="font-medium mb-2">{q.question}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {q.type === "mcq" ? "Multiple Choice" : 
                       q.type === "multiple_select" ? "Multiple Select" :
                       q.type === "short_answer" ? "Short Answer" : "Essay"}
                    </Badge>
                    <span>{q.points} pts</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TakeQuiz({ quiz, studentId, onComplete, onCancel }: {
  quiz: TeacherQuiz;
  studentId: string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const questions = quiz.questions as TeacherQuizQuestion[];
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      let autoScore = 0;
      
      const formattedAnswers = questions.map(q => {
        const answer = answers[q.id];
        let isCorrect = false;
        let pointsAwarded = 0;
        
        if (q.type === "mcq" && answer !== undefined && q.correctAnswer === answer) {
          isCorrect = true;
          pointsAwarded = q.points;
          autoScore += q.points;
        } else if (q.type === "multiple_select" && answer && Array.isArray(answer)) {
          const correctNums = [...q.correctAnswers].map(Number).sort((a, b) => a - b);
          const givenNums = [...(answer as (number | string)[])].map(Number).sort((a, b) => a - b);
          const correct = correctNums.join(",");
          const given = givenNums.join(",");
          if (correct === given) {
            isCorrect = true;
            pointsAwarded = q.points;
            autoScore += q.points;
          }
        } else if (q.type === "short_answer" && answer && q.acceptedAnswers?.length) {
          const normalizedAnswer = answer.toLowerCase().trim();
          if (q.acceptedAnswers.some(a => a.toLowerCase().trim() === normalizedAnswer)) {
            isCorrect = true;
            pointsAwarded = q.points;
            autoScore += q.points;
          }
        }
        
        return {
          questionId: q.id,
          questionType: q.type,
          selectedAnswer: q.type === "mcq" ? answer : undefined,
          selectedAnswers: q.type === "multiple_select" ? answer : undefined,
          textAnswer: (q.type === "short_answer" || q.type === "essay") ? answer : undefined,
          isCorrect: (q.type === "mcq" || q.type === "multiple_select" || (q.type === "short_answer" && q.acceptedAnswers?.length)) ? isCorrect : undefined,
          pointsAwarded,
        };
      });
      
      return await apiRequest("POST", `/api/teacher-quizzes/${quiz.id}/attempts`, {
        studentId,
        answers: formattedAnswers,
        timeSpent,
        autoScore,
      });
    },
    onSuccess: () => {
      toast({ title: "Quiz Submitted!", description: "Your answers have been recorded." });
      onComplete();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap sticky top-0 bg-background py-2 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-semibold">{quiz.title}</h3>
        </div>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <Badge variant={timeLeft < 60 ? "destructive" : "outline"} className="gap-1 text-base px-3 py-1">
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </Badge>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={submitMutation.isPending}
            data-testid="button-submit-quiz"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <Card key={q.id} className="border" data-testid={`take-question-${index}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-4">
                <span className="text-sm font-medium text-muted-foreground">Q{index + 1}.</span>
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <span className="text-xs text-muted-foreground">{q.points} points</span>
                </div>
              </div>

              {q.type === "mcq" && (
                <RadioGroup
                  value={answers[q.id]?.toString()}
                  onValueChange={(value) => setAnswers({ ...answers, [q.id]: parseInt(value) })}
                >
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                      <RadioGroupItem value={optIndex.toString()} id={`${q.id}-${optIndex}`} />
                      <Label htmlFor={`${q.id}-${optIndex}`} className="flex-1 cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {q.type === "multiple_select" && (
                <div className="space-y-2">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                      <Checkbox
                        id={`${q.id}-${optIndex}`}
                        checked={(answers[q.id] || []).includes(optIndex)}
                        onCheckedChange={(checked) => {
                          const current = answers[q.id] || [];
                          const newAnswers = checked
                            ? [...current, optIndex]
                            : current.filter((i: number) => i !== optIndex);
                          setAnswers({ ...answers, [q.id]: newAnswers });
                        }}
                      />
                      <Label htmlFor={`${q.id}-${optIndex}`} className="flex-1 cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </div>
              )}

              {q.type === "short_answer" && (
                <Input
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Enter your answer..."
                />
              )}

              {q.type === "essay" && (
                <div className="space-y-2">
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Write your essay..."
                    rows={6}
                  />
                  {q.maxWords && (
                    <p className="text-xs text-muted-foreground">
                      Max words: {q.maxWords} | Current: {(answers[q.id] || "").split(/\s+/).filter(Boolean).length}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StudentsTab({ students, classId, onRefresh }: { students: any[]; classId: string; onRefresh: () => void }) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [studentUsername, setStudentUsername] = useState("");

  const addStudentMutation = useMutation({
    mutationFn: async (username: string) => {
      return await apiRequest("POST", `/api/classes/${classId}/students`, { username });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Student added to class!" });
      setShowAddDialog(false);
      setStudentUsername("");
      onRefresh();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return await apiRequest("DELETE", `/api/classes/${classId}/students/${studentId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Student removed from class" });
      onRefresh();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold">Enrolled Students ({students.length})</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-student">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student to Class</DialogTitle>
              <DialogDescription>
                Enter the student's username to add them to this class.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student-username">Student Username</Label>
                <Input
                  id="student-username"
                  data-testid="input-student-username"
                  value={studentUsername}
                  onChange={(e) => setStudentUsername(e.target.value)}
                  placeholder="Enter student's username"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addStudentMutation.mutate(studentUsername)}
                disabled={!studentUsername.trim() || addStudentMutation.isPending}
                data-testid="button-confirm-add-student"
              >
                {addStudentMutation.isPending ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {students.length === 0 ? (
        <Card className="border">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No students enrolled yet. Share your class code or add students manually.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student: any) => (
            <Card key={student.id} className="border" data-testid={`student-item-${student.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {student.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">@{student.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStudentMutation.mutate(student.id)}
                    disabled={removeStudentMutation.isPending}
                    data-testid={`button-remove-student-${student.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-chart-2" />
                    {student.points || 0} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-chart-3" />
                    {student.streak || 0} days
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-primary" />
                    Lvl {student.level || 1}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
