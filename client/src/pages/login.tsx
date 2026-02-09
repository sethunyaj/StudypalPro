import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Lock, Moon, Brain, BarChart3, Users, GraduationCap, Shield, BookOpen, ChevronDown } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginRole, setLoginRole] = useState<"student" | "teacher" | "admin">("student");

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
      toast({ title: "Welcome back!", description: `Logged in as ${user.name}` });
      if (user.role === "admin") setLocation("/admin");
      else if (user.role === "teacher") setLocation("/classes");
      else setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        username: regUsername,
        password: regPassword,
        name: regName,
        grade: regRole === "student" ? regGrade || null : null,
        role: regRole,
      });
      const user = await response.json();
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "authenticated");
      toast({ title: "Account created!", description: `Welcome to Study Pal, ${user.name}!` });
      if (regRole === "teacher") setLocation("/classes");
      else setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: "Registration failed", description: error.message || "Could not create account", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1a0533 0%, #2d1b69 25%, #4c2889 45%, #6b3fa0 60%, #7c5cbf 75%, #8b6fc0 100%)",
        }}
      />

      <div
        className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div
        className="absolute bottom-[-5%] right-[10%] w-[600px] h-[600px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)", filter: "blur(100px)" }}
      />
      <div
        className="absolute top-[30%] right-[30%] w-[300px] h-[300px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="absolute bottom-[20%] left-[5%] w-[250px] h-[250px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, rgba(192,132,252,0.5) 0%, transparent 70%)", filter: "blur(50px)" }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 w-full max-w-5xl mx-auto px-6 py-8">
        <div className="flex-1 max-w-md text-center lg:text-left">
          <h1 className="text-5xl lg:text-6xl font-bold text-white tracking-tight mb-3" data-testid="text-brand-title">
            Study Pal
          </h1>
          <p className="text-lg text-purple-200/80 mb-10" data-testid="text-brand-tagline">
            Your AI-Powered Learning Companion
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-md bg-purple-500/20 border border-purple-400/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Smart Learning</h3>
                <p className="text-purple-300/70 text-sm leading-relaxed">AI-powered study tools and personalized learning paths</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-md bg-purple-500/20 border border-purple-400/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Track Progress</h3>
                <p className="text-purple-300/70 text-sm leading-relaxed">Monitor your growth with detailed analytics and insights</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-md bg-purple-500/20 border border-purple-400/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Collaborate</h3>
                <p className="text-purple-300/70 text-sm leading-relaxed">Join study groups and learn together with peers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            {mode === "login" ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1" data-testid="text-form-title">Welcome to Study Pal</h2>
                  <p className="text-sm text-purple-200/60">Sign in to continue learning</p>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setLoginRole("student")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      loginRole === "student"
                        ? "bg-purple-500/30 text-white border border-purple-400/30"
                        : "text-purple-300/60 hover:text-purple-200"
                    }`}
                    data-testid="button-student-mode"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginRole("teacher")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      loginRole === "teacher"
                        ? "bg-purple-500/30 text-white border border-purple-400/30"
                        : "text-purple-300/60 hover:text-purple-200"
                    }`}
                    data-testid="button-teacher-mode"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginRole("admin")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      loginRole === "admin"
                        ? "bg-purple-500/30 text-white border border-purple-400/30"
                        : "text-purple-300/60 hover:text-purple-200"
                    }`}
                    data-testid="button-admin-mode"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/50" />
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Username"
                      required
                      data-testid="input-login-username"
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-purple-300/40 outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/50" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                      required
                      data-testid="input-login-password"
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-purple-300/40 outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    data-testid="button-login"
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(124, 58, 237, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(124, 58, 237, 0.4)";
                    }}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-sm text-purple-300/60 hover:text-purple-200 transition-colors"
                    data-testid="link-create-account"
                  >
                    Create Account
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1" data-testid="text-register-title">Create Account</h2>
                  <p className="text-sm text-purple-200/60">Join Study Pal and start learning</p>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setRegRole("student")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      regRole === "student"
                        ? "bg-purple-500/30 text-white border border-purple-400/30"
                        : "text-purple-300/60 hover:text-purple-200"
                    }`}
                    data-testid="button-reg-student"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole("teacher")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      regRole === "teacher"
                        ? "bg-purple-500/30 text-white border border-purple-400/30"
                        : "text-purple-300/60 hover:text-purple-200"
                    }`}
                    data-testid="button-reg-teacher"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Teacher
                  </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/50" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Full Name"
                      required
                      data-testid="input-reg-name"
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-purple-300/40 outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/50" />
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Username"
                      required
                      data-testid="input-reg-username"
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-purple-300/40 outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/50" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Password"
                      required
                      data-testid="input-reg-password"
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-purple-300/40 outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    />
                  </div>

                  {regRole === "student" && (
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/50" />
                      <input
                        type="text"
                        value={regGrade}
                        onChange={(e) => setRegGrade(e.target.value)}
                        placeholder="Grade Level (Optional)"
                        data-testid="input-reg-grade"
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white placeholder-purple-300/40 outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
                        style={{
                          background: "rgba(0, 0, 0, 0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    data-testid="button-register"
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(124, 58, 237, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(124, 58, 237, 0.4)";
                    }}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-sm text-purple-300/60 hover:text-purple-200 transition-colors"
                    data-testid="link-sign-in"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 pt-5 flex items-center justify-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Moon className="w-4 h-4 text-purple-300/40" />
              <span className="text-sm text-purple-300/40 font-medium">Study Pal</span>
              <span className="text-xs text-purple-300/30 ml-1">v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
