import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Loader2,
} from "lucide-react";
import type { TrainingQuizQuestion, TrainingQuizAttempt } from "@shared/schema";

interface QuizTakerProps {
  itemId: string;
  userId: string;
  questions: TrainingQuizQuestion[];
  onClose: () => void;
}

export function QuizTaker({ itemId, userId, questions, onClose }: QuizTakerProps) {
  const { toast } = useToast();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; answers: any[] } | null>(null);

  const { data: existingAttempt, isLoading: attemptLoading } = useQuery<TrainingQuizAttempt | null>({
    queryKey: ["/api/training/quiz", itemId, "my-attempt", userId],
    queryFn: async () => {
      const res = await fetch(`/api/training/quiz/${itemId}/my-attempt?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load attempt");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const answers = questions.map(q => ({
        questionId: q.id,
        selectedAnswer: selectedAnswers[q.id] ?? -1,
      }));
      const res = await apiRequest("POST", `/api/training/quiz/${itemId}/attempt`, {
        userId,
        answers,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      setSubmitted(true);
      setResult({
        score: data.score,
        total: data.totalQuestions,
        answers: data.answers,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/quiz", itemId, "my-attempt", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/progress", userId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function handleRetake() {
    setSelectedAnswers({});
    setSubmitted(false);
    setResult(null);
  }

  if (attemptLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const previousAttempt = existingAttempt && !submitted ? existingAttempt : null;

  if (previousAttempt) {
    const percentage = Math.round((previousAttempt.score / previousAttempt.totalQuestions) * 100);
    const passed = percentage >= 70;
    const prevAnswers = previousAttempt.answers as any[];

    return (
      <div className="space-y-4">
        <div className="text-center p-4 border rounded-md">
          <Trophy className={`h-10 w-10 mx-auto mb-2 ${passed ? "text-chart-2" : "text-chart-5"}`} />
          <p className="text-lg font-semibold">Previous Score: {previousAttempt.score}/{previousAttempt.totalQuestions}</p>
          <p className="text-sm text-muted-foreground">{percentage}% {passed ? "- Passed" : "- Try again!"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Completed {new Date(previousAttempt.completedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-2">
          {questions.map((q, idx) => {
            const prevAnswer = prevAnswers?.find((a: any) => a.questionId === q.id);
            const selected = prevAnswer?.selectedAnswer ?? -1;
            const isCorrect = prevAnswer?.isCorrect;
            return (
              <Card key={q.id} className="border" data-testid={`card-prev-question-${idx}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">{idx + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{q.question}</p>
                      <div className="mt-1.5 space-y-1">
                        {q.options.map((opt, oi) => {
                          let cls = "text-xs p-1.5 rounded";
                          if (oi === q.correctAnswer) cls += " text-chart-2 font-medium bg-chart-2/10";
                          else if (oi === selected && !isCorrect) cls += " text-destructive line-through";
                          else cls += " text-muted-foreground";
                          return (
                            <p key={oi} className={cls}>
                              {String.fromCharCode(65 + oi)}. {opt}
                            </p>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">{q.explanation}</p>
                      )}
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button onClick={handleRetake} className="w-full gap-2" data-testid="button-retake-quiz">
          <RotateCcw className="h-4 w-4" />
          Retake Quiz
        </Button>
      </div>
    );
  }

  if (submitted && result) {
    const percentage = Math.round((result.score / result.total) * 100);
    const passed = percentage >= 70;

    return (
      <div className="space-y-4">
        <div className="text-center p-4 border rounded-md">
          <Trophy className={`h-10 w-10 mx-auto mb-2 ${passed ? "text-chart-2" : "text-chart-5"}`} />
          <p className="text-lg font-semibold">Score: {result.score}/{result.total}</p>
          <p className="text-sm text-muted-foreground">{percentage}% {passed ? "- Great job!" : "- Keep studying!"}</p>
        </div>

        <div className="space-y-2">
          {questions.map((q, idx) => {
            const answer = result.answers.find((a: any) => a.questionId === q.id);
            const selected = answer?.selectedAnswer ?? -1;
            const isCorrect = answer?.isCorrect;
            return (
              <Card key={q.id} className="border" data-testid={`card-result-question-${idx}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">{idx + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{q.question}</p>
                      <div className="mt-1.5 space-y-1">
                        {q.options.map((opt, oi) => {
                          let cls = "text-xs p-1.5 rounded";
                          if (oi === q.correctAnswer) cls += " text-chart-2 font-medium bg-chart-2/10";
                          else if (oi === selected && !isCorrect) cls += " text-destructive line-through";
                          else cls += " text-muted-foreground";
                          return (
                            <p key={oi} className={cls}>
                              {String.fromCharCode(65 + oi)}. {opt}
                            </p>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">{q.explanation}</p>
                      )}
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button onClick={handleRetake} variant="outline" className="w-full gap-2" data-testid="button-retake-quiz">
          <RotateCcw className="h-4 w-4" />
          Retake Quiz
        </Button>
      </div>
    );
  }

  const allAnswered = questions.every(q => selectedAnswers[q.id] !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {Object.keys(selectedAnswers).length}/{questions.length} answered
        </p>
        <Badge variant="secondary">{questions.length} questions</Badge>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <Card key={q.id} className="border" data-testid={`card-take-question-${idx}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="shrink-0 mt-0.5">{idx + 1}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-2">{q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: oi })}
                        className={`w-full text-left text-sm p-2 rounded-md border transition-colors flex items-center gap-2 ${
                          selectedAnswers[q.id] === oi
                            ? "border-primary bg-primary/10 font-medium"
                            : "border-border hover-elevate"
                        }`}
                        data-testid={`button-answer-${idx}-${oi}`}
                      >
                        <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                          selectedAnswers[q.id] === oi
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={() => submitMutation.mutate()}
        disabled={!allAnswered || submitMutation.isPending}
        data-testid="button-submit-quiz"
      >
        {submitMutation.isPending ? (
          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting...</>
        ) : (
          `Submit Quiz (${Object.keys(selectedAnswers).length}/${questions.length})`
        )}
      </Button>
    </div>
  );
}
