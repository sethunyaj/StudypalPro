import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trophy, Flame, BookOpen, Shield, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"student" | "admin">("student");

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regGrade, setRegGrade] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        username: loginUsername,
        password: loginPassword,
      });
      const user = await res.json();
      
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "authenticated");
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      
      if (user.role === "admin") {
        setLocation("/admin");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        username: regUsername,
        password: regPassword,
        name: regName,
        grade: regGrade || null,
        role: "student",
      });
      const user = await res.json();
      
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "authenticated");
      
      toast({
        title: "Account created!",
        description: "Welcome to Hibiscus StudyPal",
      });
      
      setLocation("/dashboard");
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
      const res = await apiRequest("POST", "/api/auth/register", {
        username: "demo",
        password: "demo123",
        name: "Demo Student",
        grade: "Grade 10",
        role: "student",
      });
      const user = await res.json();
      
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

  return (
    <div className="min-h-screen hibiscus-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="text-6xl font-bold hibiscus-text-gradient">HS</div>
          </div>
          <CardTitle className="text-3xl font-bold">Hibiscus StudyPal</CardTitle>
          <CardDescription className="text-base">Your Ultimate Learning Platform</CardDescription>
          
          {/* Login Mode Toggle */}
          <div className="mt-4 flex items-center justify-center gap-2">
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
            // Admin Login Form (no registration)
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
          ) : (
            // Student Login/Register Tabs
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
                </form>
              </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <Alert className="bg-primary/10 border-primary/30">
                  <BookOpen className="h-4 w-4" />
                  <AlertDescription>
                    Join thousands of students learning smarter!
                  </AlertDescription>
                </Alert>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={createDemoStudent}
                  data-testid="button-create-demo"
                  disabled={isLoading}
                >
                  Create Demo Account
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or register</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input
                    id="reg-name"
                    data-testid="input-register-name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Student ID / Username</Label>
                  <Input
                    id="reg-username"
                    data-testid="input-register-username"
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
                    data-testid="input-register-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create password"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-grade">Grade/Class</Label>
                  <Input
                    id="reg-grade"
                    data-testid="input-register-grade"
                    value={regGrade}
                    onChange={(e) => setRegGrade(e.target.value)}
                    placeholder="e.g., Grade 10"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  data-testid="button-register"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>Achievements</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              <span>Streaks</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>AI Tutor</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
