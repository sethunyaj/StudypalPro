import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MessageSquare } from "lucide-react";

interface AITutorProps {
  userId: string;
}

// Helper function to extract iframe src from embed code
function extractIframeSrc(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // If user pasted entire iframe tag, extract the src
  const iframeMatch = input.match(/src=["']([^"']+)["']/);
  if (iframeMatch) {
    return iframeMatch[1];
  }

  // If it's already a URL, validate it
  const cleaned = input.trim();
  if (cleaned.startsWith('http')) {
    return cleaned;
  }

  // If it's just a bot ID, construct the URL
  if (/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return `https://app.fastbots.ai/embed/${cleaned}`;
  }

  return null;
}

export default function AITutor({ userId }: AITutorProps) {
  const { data: config } = useQuery({
    queryKey: ['/api/settings/fastbots'],
  });

  // Extract iframe src URL
  const iframeSrc = config?.enabled && config?.botId ? extractIframeSrc(config.botId) : null;

  if (!iframeSrc) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle>AI Study Assistant</CardTitle>
            </div>
            <CardDescription>
              Your personal AI tutor is not configured yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                The AI Study Assistant helps you with homework, explains concepts, and answers your questions.
              </p>
              <p>
                Contact your administrator to enable this feature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">AI Study Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Get instant help with your studies, homework, and questions
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <iframe
            src={iframeSrc}
            className="w-full border-0"
            style={{ height: 'calc(100vh - 400px)', minHeight: '600px' }}
            title="AI Study Assistant"
            data-testid="fastbots-iframe"
          />
        </CardContent>
      </Card>
    </div>
  );
}
