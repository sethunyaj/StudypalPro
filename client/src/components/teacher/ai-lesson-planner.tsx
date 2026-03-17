import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, Download, Printer, BookOpen, ClipboardList,
  Loader2, GraduationCap, Clock, ChevronRight, FileText, RotateCcw, FileType
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const GRADE_LEVELS = [
  "Kindergarten",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6",
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12",
  "Pre-K / Early Childhood",
  "Primary (General)",
  "Lower Secondary (General)",
  "Upper Secondary (General)",
  "A-Level / Pre-University",
  "University / College",
];

const DURATIONS = [
  "30 minutes", "45 minutes", "60 minutes", "75 minutes", "90 minutes", "2 hours",
];

type DocType = "lesson-plan" | "study-notes";

interface GeneratedDoc {
  type: DocType;
  content: string;
  grade: string;
  subject: string;
  topic: string;
}

interface AILessonPlannerProps {
  defaultSubject?: string;
}

export function AILessonPlanner({ defaultSubject }: AILessonPlannerProps) {
  const { toast } = useToast();
  const [docType, setDocType] = useState<DocType>("lesson-plan");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState(defaultSubject || "");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("60 minutes");
  const [generated, setGenerated] = useState<GeneratedDoc | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const endpoint = docType === "lesson-plan" ? "/api/ai/lesson-plan" : "/api/ai/study-notes";
      const body = docType === "lesson-plan"
        ? { grade, subject, topic, duration }
        : { grade, subject, topic };
      const res = await apiRequest("POST", endpoint, body);
      return res.json();
    },
    onSuccess: (data) => {
      setGenerated({ type: docType, content: data.content, grade, subject, topic });
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade || !subject || !topic) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    generateMutation.mutate();
  };

  const buildFilename = () => {
    const typeName = generated?.type === "lesson-plan" ? "Lesson_Plan" : "Study_Notes";
    return `${typeName}_${generated?.grade}_${generated?.subject}_${generated?.topic}`
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80);
  };

  const handleDownloadWord = () => {
    if (!generated) return;
    const typeName = generated.type === "lesson-plan" ? "Lesson Plan" : "Study Notes";
    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='UTF-8'>
  <title>${typeName}: ${generated.topic}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
  <style>
    body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; color: #222; margin: 2cm; }
    h1 { font-size: 18pt; color: #1a6b3c; border-bottom: 2px solid #1a6b3c; padding-bottom: 4pt; margin-top: 0; }
    h2 { font-size: 14pt; color: #1a6b3c; margin-top: 18pt; border-bottom: 1px solid #c8e6d4; padding-bottom: 2pt; }
    h3 { font-size: 12pt; color: #2d7a50; font-style: italic; margin-top: 12pt; }
    h4 { font-size: 11pt; margin-top: 10pt; }
    p { margin-bottom: 6pt; }
    ul, ol { margin: 4pt 0 4pt 18pt; }
    li { margin-bottom: 3pt; }
    strong { font-weight: bold; }
    .meta { background: #f0f7f3; border: 1pt solid #c8e6d4; padding: 8pt 12pt; margin-bottom: 16pt; font-size: 10pt; color: #444; }
  </style>
</head>
<body>
  <div class="meta">
    <strong>Type:</strong> ${typeName} &nbsp;&nbsp;
    <strong>Grade/Level:</strong> ${generated.grade} &nbsp;&nbsp;
    <strong>Subject:</strong> ${generated.subject} &nbsp;&nbsp;
    <strong>Generated:</strong> ${new Date().toLocaleDateString()}
  </div>
  ${markdownToHtml(generated.content)}
</body>
</html>`;
    const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${buildFilename()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!generated) return;
    const typeName = generated.type === "lesson-plan" ? "Lesson Plan" : "Study Notes";
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${typeName}: ${generated.topic}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.6; color: #222; padding: 2.5cm; max-width: 21cm; margin: 0 auto; }
    h1 { font-size: 20pt; color: #1a6b3c; border-bottom: 2px solid #1a6b3c; padding-bottom: 8px; margin-bottom: 16px; margin-top: 0; }
    h2 { font-size: 14pt; color: #1a6b3c; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #d0e8d8; padding-bottom: 4px; }
    h3 { font-size: 12pt; color: #2d7a50; margin-top: 16px; margin-bottom: 6px; font-style: italic; }
    h4 { font-size: 11pt; color: #333; margin-top: 12px; margin-bottom: 4px; }
    p { margin-bottom: 8px; }
    ul, ol { margin: 8px 0 8px 24px; }
    li { margin-bottom: 4px; }
    strong { color: #111; }
    .meta { background: #f0f7f3; border: 1px solid #c8e6d4; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 10pt; color: #444; }
    .meta span { margin-right: 20px; }
    @media print {
      body { padding: 1.5cm; }
      h1 { page-break-after: avoid; }
      h2, h3 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="meta">
    <span><strong>Type:</strong> ${typeName}</span>
    <span><strong>Grade/Level:</strong> ${generated.grade}</span>
    <span><strong>Subject:</strong> ${generated.subject}</span>
    <span><strong>Generated:</strong> ${new Date().toLocaleDateString()}</span>
  </div>
  ${markdownToHtml(generated.content)}
</body>
</html>`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Please allow popups to print", variant: "destructive" });
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold">AI Lesson Planner</h3>
          <p className="text-sm text-muted-foreground">Generate lesson plans and study notes — download or print instantly</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Document Settings</CardTitle>
            <CardDescription>Choose what to generate and for which class</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType("lesson-plan")}
                    data-testid="btn-type-lesson-plan"
                    className={`flex items-center gap-2 p-3 rounded-md border text-sm font-medium transition-colors text-left ${
                      docType === "lesson-plan"
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border hover-elevate"
                    }`}
                  >
                    <ClipboardList className="h-4 w-4 shrink-0" />
                    Lesson Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType("study-notes")}
                    data-testid="btn-type-study-notes"
                    className={`flex items-center gap-2 p-3 rounded-md border text-sm font-medium transition-colors text-left ${
                      docType === "study-notes"
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border hover-elevate"
                    }`}
                  >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    Study Notes
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade-select">Grade / Level</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="grade-select" data-testid="select-grade">
                    <SelectValue placeholder="Select grade or level..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {GRADE_LEVELS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject-input">Subject</Label>
                <Input
                  id="subject-input"
                  data-testid="input-subject"
                  placeholder="e.g., Mathematics, Chemistry, English..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic-input">Topic</Label>
                <Input
                  id="topic-input"
                  data-testid="input-topic"
                  placeholder="e.g., Shapes and Colours, Reversible Reactions..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {docType === "lesson-plan" && (
                <div className="space-y-2">
                  <Label htmlFor="duration-select">Lesson Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration-select" data-testid="select-duration">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={generateMutation.isPending || !grade || !subject || !topic}
                data-testid="button-generate-plan"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating {docType === "lesson-plan" ? "Lesson Plan" : "Study Notes"}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate {docType === "lesson-plan" ? "Lesson Plan" : "Study Notes"}
                  </>
                )}
              </Button>
            </form>

            {generated && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-3">Download Options</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleDownloadWord}
                    data-testid="button-download-word"
                  >
                    <FileType className="h-4 w-4 mr-2" />
                    Word (.doc)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handlePrint}
                    data-testid="button-download-pdf"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setGenerated(null)}
                  data-testid="button-reset-planner"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Generate New
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          {generateMutation.isPending ? (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Creating your {docType === "lesson-plan" ? "lesson plan" : "study notes"}...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI is crafting a comprehensive document for {grade} — {topic}
                  </p>
                </div>
              </div>
            </Card>
          ) : generated ? (
            <Card className="max-h-[700px] overflow-y-auto">
              <CardHeader className="pb-3 sticky top-0 bg-card z-10 border-b">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {generated.type === "lesson-plan" ? (
                        <ClipboardList className="h-4 w-4 text-primary" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-primary" />
                      )}
                      {generated.type === "lesson-plan" ? "Lesson Plan" : "Study Notes"}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {generated.grade}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{generated.subject}</Badge>
                      <Badge variant="outline" className="text-xs">{generated.topic}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="icon" variant="ghost" onClick={handleDownloadWord} title="Download as Word (.doc)" data-testid="button-download-word-header">
                      <FileType className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handlePrint} title="Download as PDF" data-testid="button-download-pdf-header">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <DocumentRenderer content={generated.content} />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-96 flex items-center justify-center border-dashed">
              <div className="text-center space-y-3 px-6">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Your document will appear here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in the form and click Generate to create a lesson plan or study notes
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 justify-center">
                    <ChevronRight className="h-3 w-3" /> Full lesson structure with activities
                  </span>
                  <span className="flex items-center gap-1.5 justify-center">
                    <ChevronRight className="h-3 w-3" /> Learning objectives &amp; assessment
                  </span>
                  <span className="flex items-center gap-1.5 justify-center">
                    <ChevronRight className="h-3 w-3" /> Download as text or print as PDF
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentRenderer({ content }: { content: string }) {
  const lines = content.split('\n');

  const renderInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold text-primary mt-2 mb-3 pb-2 border-b-2 border-primary/30">{renderInline(line.slice(2))}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold mt-5 mb-2 pb-1 border-b border-border text-foreground">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-semibold mt-4 mb-1.5 text-primary/80 italic">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith('#### ')) {
      elements.push(<h4 key={i} className="text-sm font-semibold mt-3 mb-1">{renderInline(line.slice(5))}</h4>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(<li key={i} className="text-sm text-muted-foreground">{renderInline(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="ml-4 space-y-1 my-2 list-disc list-outside">{listItems}</ul>);
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s/, '');
        listItems.push(<li key={i} className="text-sm text-muted-foreground">{renderInline(text)}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="ml-4 space-y-1 my-2 list-decimal list-outside">{listItems}</ol>);
      continue;
    } else if (line.startsWith('---') || line.startsWith('===')) {
      elements.push(<Separator key={i} className="my-4" />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed">{renderInline(line)}</p>);
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---+$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  return `<p>${html}</p>`;
}
