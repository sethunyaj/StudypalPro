import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trophy, Flame, BookOpen, Shield, GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoPath from "@assets/Hibiscus StudyPal logo_1762337029890.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"student" | "teacher" | "admin">("student");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regGrade, setRegGrade] = useState("");
  const [regRole, setRegRole] = useState<"student" | "teacher">("student");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        username: loginUsername,
        password: loginPassword,
      });
      const user = await response.json();
      
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "authenticated");
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      
      if (user.role === "admin") {
        setLocation("/admin");
      } else if (user.role === "teacher") {
        setLocation("/classes");
      } else {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent, role: "student" | "teacher" = "student") => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        username: regUsername,
        password: regPassword,
        name: regName,
        grade: role === "student" ? regGrade || null : null,
        role: role,
      });
      const user = await response.json();
      
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "authenticated");
      
      toast({
        title: "Account created!",
        description: `Welcome to Hibiscus StudyPal, ${user.name}!`,
      });
      
      if (role === "teacher") {
        setLocation("/classes");
      } else {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoStudent = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        username: "demo",
        password: "demo123",
        name: "Demo Student",
        grade: "Grade 10",
        role: "student",
      });
      const user = await response.json();
      
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "authenticated");
      
      toast({
        title: "Demo account created!",
        description: "You can now explore all features",
      });
      
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Note",
        description: "Demo account might already exist. Try logging in with demo/demo123",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoTeacher = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        username: "teacher",
        password: "teacher123",
        name: "Demo Teacher",
        grade: null,
        role: "teacher",
      });
      const user = await response.json();
      
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "authenticated");
      
      toast({
        title: "Teacher account created!",
        description: "You can now create classes",
      });
      
      setLocation("/classes");
    } catch (error: any) {
      toast({
        title: "Note",
        description: "Teacher account might already exist. Try logging in with teacher/teacher123",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <img src={logoPath} alt="Hibiscus StudyPal" className="h-32 w-auto mx-auto" />
          </div>
          <CardDescription className="text-base">Your Ultimate Learning Platform</CardDescription>
          
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <Button
              variant={loginMode === "student" ? "default" : "outline"}
              size="sm"
              onClick={() => setLoginMode("student")}
              className="flex items-center gap-2"
              data-testid="button-student-mode"
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </Button>
            <Button
              variant={loginMode === "teacher" ? "default" : "outline"}
              size="sm"
              onClick={() => setLoginMode("teacher")}
              className="flex items-center gap-2"
              data-testid="button-teacher-mode"
            >
              <Users className="h-4 w-4" />
              Teacher
            </Button>
            <Button
              variant={loginMode === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => setLoginMode("admin")}
              className="flex items-center gap-2"
              data-testid="button-admin-mode"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loginMode === "admin" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Alert className="bg-primary/10 border-primary/30">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Admin Access - Authorized Personnel Only
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="admin-username">Admin Username</Label>
                <Input
                  id="admin-username"
                  data-testid="input-admin-username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter admin username"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-password">Admin Password</Label>
                <Input
                  id="admin-password"
                  data-testid="input-admin-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              
              <Button
                type="submit"
                data-testid="button-admin-login"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Admin Sign In"}
              </Button>
            </form>
          ) : loginMode === "teacher" ? (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-teacher-login">Sign In</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-teacher-register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Alert className="bg-chart-2/10 border-chart-2/30">
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Welcome back! Manage your classes and students.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teacher-login-username">Username</Label>
                    <Input
                      id="teacher-login-username"
                      data-testid="input-teacher-login-username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teacher-login-password">Password</Label>
                    <Input
                      id="teacher-login-password"
                      data-testid="input-teacher-login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    data-testid="button-teacher-login"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or try demo</span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={createDemoTeacher}
                    disabled={isLoading}
                    data-testid="button-demo-teacher"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Create Demo Teacher Account
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={(e) => handleRegister(e, "teacher")} className="space-y-4">
                  <Alert className="bg-chart-2/10 border-chart-2/30">
                    <BookOpen className="h-4 w-4" />
                    <AlertDescription>
                      Create classes, post assignments, and help students learn!
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teacher-reg-name">Full Name</Label>
                    <Input
                      id="teacher-reg-name"
                      data-testid="input-teacher-reg-name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teacher-reg-username">Username</Label>
                    <Input
                      id="teacher-reg-username"
                      data-testid="input-teacher-reg-username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teacher-reg-password">Password</Label>
                    <Input
                      id="teacher-reg-password"
                      data-testid="input-teacher-reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    data-testid="button-teacher-register"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Teacher Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Alert className="bg-primary/10 border-primary/30">
                    <Trophy className="h-4 w-4" />
                    <AlertDescription>
                      Welcome back! Continue your learning journey.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Student ID / Username</Label>
                    <Input
                      id="login-username"
                      data-testid="input-login-username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      data-testid="input-login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    data-testid="button-login"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or try demo</span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={createDemoStudent}
                    disabled={isLoading}
                    data-testid="button-demo-student"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Create Demo Student Account
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={(e) => handleRegister(e, "student")} className="space-y-4">
                  <Alert className="bg-primary/10 border-primary/30">
                    <BookOpen className="h-4 w-4" />
                    <AlertDescription>
                      Join thousands of students learning smarter!
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      data-testid="input-reg-name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <Input
                      id="reg-username"
                      data-testid="input-reg-username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      data-testid="input-reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-grade">Grade Level (Optional)</Label>
                    <Input
                      id="reg-grade"
                      data-testid="input-reg-grade"
                      value={regGrade}
                      onChange={(e) => setRegGrade(e.target.value)}
                      placeholder="e.g., Grade 10"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    data-testid="button-register"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Student Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-4 border-t">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-chart-2" />
              <span>Earn XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-chart-3" />
              <span>Build Streaks</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>AI-Powered</span>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
