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
  Trophy, Flame, Target, BookMarked, Trash2, ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import logoPath from "@assets/Hibiscus StudyPal logo_1762337029890.png";
import type { Class, Todo, Exam, ClassResource } from "@shared/schema";

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
    <div className="min-h-screen hibiscus-gradient">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="glass-effect shadow-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-chart-2/10 to-chart-3/10 border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Hibiscus StudyPal" className="h-12 w-auto" />
                <div>
                  <CardTitle className="text-lg">My Classes</CardTitle>
                  <CardDescription className="text-sm">
                    {isTeacher ? "Manage your classes and students" : "View your enrolled classes"}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {isTeacher ? "Teacher" : "Student"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
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
                    {isTeacher ? (
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
                  <Card className="glass-effect">
                    <CardContent className="p-8 text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {isTeacher 
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
                        isTeacher={isTeacher}
                      />
                    ))}
                  </div>
                )}
              </div>

              {!isTeacher && (
                <div className="space-y-6">
                  <Card className="glass-effect">
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

                  <Card className="glass-effect">
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
          </CardContent>
        </Card>
      </div>
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
      className={`glass-effect hover-elevate cursor-pointer transition-all bg-gradient-to-br ${gradientClass} border`}
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

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["/api/classes", classData.id, "students"],
    enabled: isTeacher,
  });

  return (
    <div className="min-h-screen hibiscus-gradient">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Card className="glass-effect shadow-2xl overflow-hidden">
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
                {isTeacher && (
                  <TabsTrigger value="students" className="gap-2 data-[state=active]:bg-card" data-testid="tab-students">
                    <Users className="h-4 w-4" />
                    Students
                  </TabsTrigger>
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

              {isTeacher && (
                <TabsContent value="students" className="mt-0">
                  <StudentsTab students={students as any[]} />
                </TabsContent>
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
        <Card className="glass-effect">
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
              <Card key={todo.id} className="glass-effect" data-testid={`todo-item-${todo.id}`}>
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
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/classes/${classId}/exams`, {
        title,
        description,
        date: new Date(date).toISOString(),
        topics: topics.split(",").map(t => t.trim()).filter(Boolean),
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
        <Card className="glass-effect">
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
              <Card key={exam.id} className={`glass-effect ${isPastExam ? "opacity-60" : ""}`} data-testid={`exam-item-${exam.id}`}>
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
                        <div className="flex flex-wrap gap-1">
                          {exam.topics.map((topic, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
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
      default: return <FileText className="h-4 w-4" />;
    }
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
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger data-testid="select-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="text">Text/Notes</SelectItem>
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
                  disabled={!title.trim() || (type === "link" && !url.trim()) || (type === "text" && !content.trim()) || addMutation.isPending}
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
        <Card className="glass-effect">
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
            <Card key={resource.id} className="glass-effect" data-testid={`resource-item-${resource.id}`}>
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

function StudentsTab({ students }: { students: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Enrolled Students ({students.length})</h3>
      
      {students.length === 0 ? (
        <Card className="glass-effect">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No students enrolled yet. Share your class code to get students started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student: any) => (
            <Card key={student.id} className="glass-effect" data-testid={`student-item-${student.id}`}>
              <CardContent className="p-4">
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
