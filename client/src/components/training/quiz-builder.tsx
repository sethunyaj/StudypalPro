import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  Loader2,
  FileUp,
  PenLine,
} from "lucide-react";
import type { TrainingQuizQuestion } from "@shared/schema";

interface QuizBuilderProps {
  userId: string;
  questions: TrainingQuizQuestion[];
  onQuestionsChange: (questions: TrainingQuizQuestion[]) => void;
}

type TabType = "upload" | "manual" | "ai";

export function QuizBuilder({ userId, questions, onQuestionsChange }: QuizBuilderProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("manual");
  const [editingQuestion, setEditingQuestion] = useState<TrainingQuizQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });

  const [aiTopic, setAiTopic] = useState("");
  const [aiNumQuestions, setAiNumQuestions] = useState("5");
  const [aiDifficulty, setAiDifficulty] = useState<string>("medium");
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<TrainingQuizQuestion[]>([]);
  const [aiApproved, setAiApproved] = useState<Set<string>>(new Set());

  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/training/quiz/ai-generate", {
        userId,
        topic: aiTopic,
        numQuestions: parseInt(aiNumQuestions),
        difficulty: aiDifficulty,
      });
      return res.json();
    },
    onSuccess: (data: TrainingQuizQuestion[]) => {
      setAiGeneratedQuestions(data);
      setAiApproved(new Set());
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function resetQuestionForm() {
    setQuestionForm({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    });
    setEditingQuestion(null);
  }

  function handleAddQuestion() {
    if (!questionForm.question.trim()) return;
    if (questionForm.options.some(o => !o.trim())) {
      toast({ title: "All 4 options are required", variant: "destructive" });
      return;
    }

    const newQuestion: TrainingQuizQuestion = {
      id: editingQuestion?.id || `tq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      question: questionForm.question.trim(),
      options: questionForm.options.map(o => o.trim()),
      correctAnswer: questionForm.correctAnswer,
      explanation: questionForm.explanation.trim() || undefined,
    };

    if (editingQuestion) {
      onQuestionsChange(questions.map(q => q.id === editingQuestion.id ? newQuestion : q));
    } else {
      onQuestionsChange([...questions, newQuestion]);
    }
    resetQuestionForm();
  }

  function handleEditQuestion(q: TrainingQuizQuestion) {
    setEditingQuestion(q);
    setQuestionForm({
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
    });
    setActiveTab("manual");
  }

  function handleDeleteQuestion(id: string) {
    onQuestionsChange(questions.filter(q => q.id !== id));
  }

  function toggleAiApprove(id: string) {
    setAiApproved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddApprovedQuestions() {
    const approved = aiGeneratedQuestions.filter(q => aiApproved.has(q.id));
    if (approved.length === 0) {
      toast({ title: "No questions selected", variant: "destructive" });
      return;
    }
    onQuestionsChange([...questions, ...approved]);
    setAiGeneratedQuestions([]);
    setAiApproved(new Set());
    toast({ title: `${approved.length} question${approved.length > 1 ? 's' : ''} added` });
  }

  const tabs: { id: TabType; label: string; icon: typeof FileUp }[] = [
    { id: "upload", label: "Upload PDF", icon: FileUp },
    { id: "manual", label: "Manual Entry", icon: PenLine },
    { id: "ai", label: "AI Generate", icon: Sparkles },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border rounded-md p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium flex-1 justify-center transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "hover-elevate"
            }`}
            data-testid={`tab-quiz-${tab.id}`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "upload" && (
        <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
          <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p>Use the file attachment field above to upload a PDF quiz.</p>
          <p className="mt-1">Teachers will download and view the PDF directly.</p>
        </div>
      )}

      {activeTab === "manual" && (
        <div className="space-y-3">
          <Card className="border">
            <CardContent className="p-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Question</Label>
                <Textarea
                  placeholder="Enter your question..."
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  className="resize-none"
                  rows={2}
                  data-testid="input-quiz-question"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Options (select the correct answer)</Label>
                <div className="space-y-1.5">
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuestionForm({ ...questionForm, correctAnswer: idx })}
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          questionForm.correctAnswer === idx
                            ? "border-chart-2 bg-chart-2 text-white"
                            : "border-muted-foreground/30"
                        }`}
                        data-testid={`button-correct-answer-${idx}`}
                      >
                        {questionForm.correctAnswer === idx && <Check className="h-3 w-3" />}
                      </button>
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[idx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOptions });
                        }}
                        className="flex-1"
                        data-testid={`input-option-${idx}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Explanation (optional)</Label>
                <Input
                  placeholder="Why is this the correct answer?"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  data-testid="input-quiz-explanation"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                {editingQuestion && (
                  <Button variant="outline" size="sm" onClick={resetQuestionForm} data-testid="button-cancel-edit-question">
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleAddQuestion}
                  disabled={!questionForm.question.trim() || questionForm.options.some(o => !o.trim())}
                  data-testid="button-add-question"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {editingQuestion ? "Update Question" : "Add Question"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-3">
          <Card className="border">
            <CardContent className="p-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Topic</Label>
                <Input
                  placeholder="e.g., Classroom Management, Child Development..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  data-testid="input-ai-topic"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Number of Questions</Label>
                  <Select value={aiNumQuestions} onValueChange={setAiNumQuestions}>
                    <SelectTrigger data-testid="select-ai-num-questions">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Difficulty</Label>
                  <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                    <SelectTrigger data-testid="select-ai-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => aiGenerateMutation.mutate()}
                disabled={!aiTopic.trim() || aiGenerateMutation.isPending}
                className="w-full"
                data-testid="button-generate-ai-quiz"
              >
                {aiGenerateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-1" /> Generate Questions</>
                )}
              </Button>
            </CardContent>
          </Card>

          {aiGeneratedQuestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  Generated Questions ({aiApproved.size}/{aiGeneratedQuestions.length} selected)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (aiApproved.size === aiGeneratedQuestions.length) {
                        setAiApproved(new Set());
                      } else {
                        setAiApproved(new Set(aiGeneratedQuestions.map(q => q.id)));
                      }
                    }}
                    data-testid="button-select-all-ai"
                  >
                    {aiApproved.size === aiGeneratedQuestions.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddApprovedQuestions}
                    disabled={aiApproved.size === 0}
                    data-testid="button-approve-ai-questions"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Add Selected
                  </Button>
                </div>
              </div>
              {aiGeneratedQuestions.map((q, idx) => (
                <Card
                  key={q.id}
                  className={`border cursor-pointer transition-colors ${
                    aiApproved.has(q.id) ? "ring-2 ring-chart-2" : ""
                  }`}
                  onClick={() => toggleAiApprove(q.id)}
                  data-testid={`card-ai-question-${idx}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                        aiApproved.has(q.id) ? "border-chart-2 bg-chart-2 text-white" : "border-muted-foreground/30"
                      }`}>
                        {aiApproved.has(q.id) && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{q.question}</p>
                        <div className="mt-1.5 space-y-0.5">
                          {q.options.map((opt, oi) => (
                            <p key={oi} className={`text-xs ${oi === q.correctAnswer ? "text-chart-2 font-medium" : "text-muted-foreground"}`}>
                              {String.fromCharCode(65 + oi)}. {opt}
                              {oi === q.correctAnswer && " (correct)"}
                            </p>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Quiz Questions ({questions.length})</p>
          {questions.map((q, idx) => (
            <Card key={q.id} className="border" data-testid={`card-question-${idx}`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="shrink-0 mt-0.5">{idx + 1}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{q.question}</p>
                    <div className="mt-1 space-y-0.5">
                      {q.options.map((opt, oi) => (
                        <p key={oi} className={`text-xs ${oi === q.correctAnswer ? "text-chart-2 font-medium" : "text-muted-foreground"}`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                          {oi === q.correctAnswer && " (correct)"}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => handleEditQuestion(q)} data-testid={`button-edit-question-${idx}`}>
                      <PenLine className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteQuestion(q.id)} data-testid={`button-delete-question-${idx}`}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
