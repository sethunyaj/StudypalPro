import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PomodoroProps {
  userId: string;
}

export default function Pomodoro({ userId }: PomodoroProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [subject, setSubject] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/study-sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats', userId] });
    },
  });

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (mode === 'focus') {
      const duration = focusDuration;
      saveMutation.mutate({
        userId,
        subject: subject || "General Study",
        duration,
        type: mode,
      });
      
      setSessions(prev => prev + 1);
      toast({ 
        title: "Focus session complete!", 
        description: `Great job! You've completed ${sessions + 1} sessions.`,
      });
      
      // Auto-switch to break
      if ((sessions + 1) % 4 === 0) {
        setMode('long_break');
        setTimeLeft(longBreakDuration * 60);
      } else {
        setMode('short_break');
        setTimeLeft(shortBreakDuration * 60);
      }
    } else {
      toast({ 
        title: "Break complete!", 
        description: "Ready for another focus session?",
      });
      setMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = mode === 'focus' ? focusDuration : mode === 'short_break' ? shortBreakDuration : longBreakDuration;
    setTimeLeft(duration * 60);
  };

  const handleModeChange = (newMode: 'focus' | 'short_break' | 'long_break') => {
    setMode(newMode);
    setIsRunning(false);
    const duration = newMode === 'focus' ? focusDuration : newMode === 'short_break' ? shortBreakDuration : longBreakDuration;
    setTimeLeft(duration * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalDuration = mode === 'focus' ? focusDuration * 60 : mode === 'short_break' ? shortBreakDuration * 60 : longBreakDuration * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pomodoro Timer</h2>
          <p className="text-sm text-muted-foreground">Stay focused with timed study sessions</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          data-testid="button-settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timer Settings</CardTitle>
            <CardDescription>Customize your Pomodoro durations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Focus (min)</Label>
                <Input
                  type="number"
                  value={focusDuration}
                  onChange={(e) => setFocusDuration(parseInt(e.target.value) || 25)}
                  min="1"
                  max="60"
                  data-testid="input-focus-duration"
                />
              </div>
              <div className="space-y-2">
                <Label>Short Break (min)</Label>
                <Input
                  type="number"
                  value={shortBreakDuration}
                  onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 5)}
                  min="1"
                  max="30"
                  data-testid="input-short-break"
                />
              </div>
              <div className="space-y-2">
                <Label>Long Break (min)</Label>
                <Input
                  type="number"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 15)}
                  min="1"
                  max="60"
                  data-testid="input-long-break"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-center gap-2 mb-8">
            <Button
              variant={mode === 'focus' ? 'default' : 'outline'}
              onClick={() => handleModeChange('focus')}
              data-testid="button-mode-focus"
              disabled={isRunning}
            >
              Focus
            </Button>
            <Button
              variant={mode === 'short_break' ? 'default' : 'outline'}
              onClick={() => handleModeChange('short_break')}
              data-testid="button-mode-short"
              disabled={isRunning}
            >
              Short Break
            </Button>
            <Button
              variant={mode === 'long_break' ? 'default' : 'outline'}
              onClick={() => handleModeChange('long_break')}
              data-testid="button-mode-long"
              disabled={isRunning}
            >
              Long Break
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="text-7xl font-bold mb-4 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <Progress value={progress} className="h-3 mb-4" />
            <p className="text-muted-foreground capitalize">
              {mode.replace('_', ' ')} Session
            </p>
          </div>

          {mode === 'focus' && (
            <div className="mb-6">
              <Label htmlFor="subject">What are you studying?</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Mathematics"
                disabled={isRunning}
                data-testid="input-subject"
                className="mt-2"
              />
            </div>
          )}

          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <Button
                size="lg"
                onClick={handleStart}
                data-testid="button-start"
                className="px-8"
              >
                <Play className="h-5 w-5 mr-2" />
                Start
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={handlePause}
                data-testid="button-pause"
                className="px-8"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{sessions}</div>
              <div className="text-sm text-muted-foreground">Sessions Today</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{sessions * focusDuration}</div>
              <div className="text-sm text-muted-foreground">Minutes Focused</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
