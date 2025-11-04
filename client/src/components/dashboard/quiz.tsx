import { useState } from "react";
import { useQuery, useMutation } from "@antml/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Sparkles, CheckCircle2, XCircle, Clock, Trophy, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuizProps {
  userId: string;
}

export default function Quiz({ userId }: QuizProps) {
  const { toast } = useToast();
  const [quizMode, setQuizMode] = useState<'select' | 'generate' | 'taking' | 'results'>('select');
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  
  // Generation parameters
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState("5");
  const [sourceNoteId, setSourceNoteId] = useState("");

  const { data: quizzes } = useQuery({
    queryKey: ['/api/quizzes', userId],
  });

  const { data: notes } = useQuery({
    queryKey: ['/api/notes', userId],
  });

  const { data: quizHistory } = useQuery({
    queryKey: ['/api/quiz-attempts', userId],
  });

  const generateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/quizzes/generate", data),
    onSuccess: (quiz) => {
      setCurrentQuiz(quiz);
      setQuizMode('taking');
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', userId] });
      toast({ title: "Quiz generated!", description: "Good luck!" });
    },
    onError: () => {
      toast({ title: "Generation failed", description: "Please try again", variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/quiz-attempts", data),
    onSuccess: (result) => {
      setCurrentQuiz({ ...currentQuiz, result });
      setQuizMode('results');
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-attempts', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats', userId] });
    },
  });

  const handleGenerateQuiz = () => {
    if (!subject) {
      toast({ title: "Subject required", description: "Please enter a subject", variant: "destructive" });
      return;
    }
    
    generateMutation.mutate({
      userId,
      subject,
      difficulty,
      numQuestions: parseInt(numQuestions),
      sourceNoteId: sourceNoteId || undefined,
    });
  };

  const handleStartQuiz = (quiz: any) => {
    setCurrentQuiz(quiz);
    setQuizMode('taking');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleSubmitQuiz = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    const answersArray = currentQuiz.questions.map((q: any) => ({
      questionId: q.id,
      userAnswer: answers[q.id] || "",
      isCorrect: answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim(),
      timeSpent: 0,
    }));

    submitMutation.mutate({
      userId,
      quizId: currentQuiz.id,
      score: answersArray.filter((a: any) => a.isCorrect).length,
      totalQuestions: currentQuiz.questions.length,
      answers: answersArray,
      timeSpent,
    });
  };

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];
  const progress = currentQuiz ? ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100 : 0;

  if (quizMode === 'taking' && currentQuiz) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{currentQuiz.title}</h2>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
            </p>
          </div>
          <Badge variant={difficulty === 'expert' ? 'destructive' : 'default'}>
            {currentQuiz.difficulty}
          </Badge>
        </div>

        <Progress value={progress} className="h-2" />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
            {currentQuestion.type === 'multiple_choice' && (
              <CardDescription>Select the correct answer</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === 'multiple_choice' && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg hover-elevate border">
                    <RadioGroupItem value={option} id={`option-${idx}`} data-testid={`radio-option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'true_false' && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg hover-elevate border">
                  <RadioGroupItem value="True" id="true" data-testid="radio-true" />
                  <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg hover-elevate border">
                  <RadioGroupItem value="False" id="false" data-testid="radio-false" />
                  <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === 'fill_blank' && (
              <Input
                placeholder="Type your answer..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                data-testid="input-answer"
              />
            )}

            {currentQuestion.type === 'short_answer' && (
              <Textarea
                placeholder="Type your answer..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={4}
                data-testid="textarea-answer"
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            data-testid="button-previous"
          >
            Previous
          </Button>
          
          {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmitQuiz}
              data-testid="button-submit-quiz"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
          ) : (
            <Button onClick={handleNext} data-testid="button-next">
              Next
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (quizMode === 'results' && currentQuiz?.result) {
    const { score, totalQuestions, answers: resultAnswers } = currentQuiz.result;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-lg bg-gradient-to-br from-primary/10 to-chart-1/10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Trophy className="h-16 w-16 text-chart-2" />
            </div>
            <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
            <CardDescription className="text-lg">
              You scored {score} out of {totalQuestions}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold mb-2 hibiscus-text-gradient">{percentage}%</div>
            <p className="text-muted-foreground">
              {percentage >= 90 ? "Outstanding!" : percentage >= 70 ? "Great job!" : percentage >= 50 ? "Good effort!" : "Keep practicing!"}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Review Answers</h3>
          {currentQuiz.questions.map((q: any, idx: number) => {
            const answer = resultAnswers.find((a: any) => a.questionId === q.id);
            return (
              <Card key={q.id} className={answer?.isCorrect ? 'border-primary' : 'border-destructive'}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">Question {idx + 1}: {q.question}</CardTitle>
                    {answer?.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Your answer: </span>
                    <span className="text-sm">{answer?.userAnswer || "No answer"}</span>
                  </div>
                  {!answer?.isCorrect && (
                    <div>
                      <span className="text-sm font-medium text-primary">Correct answer: </span>
                      <span className="text-sm">{q.correctAnswer}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button onClick={() => setQuizMode('select')} className="w-full" data-testid="button-new-quiz">
          Take Another Quiz
        </Button>
      </div>
    );
  }

  if (quizMode === 'generate') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Generate AI Quiz</h2>
          <p className="text-sm text-muted-foreground">Create a custom quiz powered by AI</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quiz Parameters
            </CardTitle>
            <CardDescription>Customize your quiz difficulty and content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., World War II, Photosynthesis, Algebra"
                data-testid="input-quiz-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy - Basic concepts</SelectItem>
                  <SelectItem value="medium">Medium - Standard understanding</SelectItem>
                  <SelectItem value="hard">Hard - Advanced application</SelectItem>
                  <SelectItem value="expert">Expert - Critical thinking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions</Label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger data-testid="select-num-questions">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 questions</SelectItem>
                  <SelectItem value="10">10 questions</SelectItem>
                  <SelectItem value="15">15 questions</SelectItem>
                  <SelectItem value="20">20 questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {notes && notes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="sourceNote">Source Note (Optional)</Label>
                <Select value={sourceNoteId} onValueChange={setSourceNoteId}>
                  <SelectTrigger data-testid="select-source-note">
                    <SelectValue placeholder="Generate from your notes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific note</SelectItem>
                    {notes.map((note: any) => (
                      <SelectItem key={note.id} value={note.id}>
                        {note.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerateQuiz}
                className="flex-1"
                disabled={generateMutation.isPending}
                data-testid="button-generate-quiz"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setQuizMode('select')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quizzes</h2>
          <p className="text-sm text-muted-foreground">Test your knowledge</p>
        </div>
        <Button onClick={() => setQuizMode('generate')} data-testid="button-new-quiz">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate AI Quiz
        </Button>
      </div>

      {/* Quiz History */}
      {quizHistory && quizHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quizHistory.slice(0, 5).map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border hover-elevate"
                >
                  <div>
                    <p className="font-medium text-sm">{attempt.quiz?.title || 'Quiz'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.score}/{attempt.totalQuestions}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes && quizzes.length > 0 ? (
          quizzes.map((quiz: any) => (
            <Card key={quiz.id} className="hover-elevate group" data-testid={`quiz-card-${quiz.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{quiz.title}</CardTitle>
                  <Badge variant={quiz.difficulty === 'expert' ? 'destructive' : 'default'}>
                    {quiz.difficulty}
                  </Badge>
                </div>
                <CardDescription>{quiz.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{quiz.questions.length} questions</span>
                  <Button
                    size="sm"
                    onClick={() => handleStartQuiz(quiz)}
                    data-testid={`button-start-quiz-${quiz.id}`}
                  >
                    Start Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full p-12 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate your first AI-powered quiz to test your knowledge
            </p>
            <Button onClick={() => setQuizMode('generate')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Quiz
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
