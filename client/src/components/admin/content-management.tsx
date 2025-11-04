import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Check, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ContentManagement() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [botId, setBotId] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const { data: fastbotsConfig } = useQuery({
    queryKey: ['/api/settings/fastbots'],
  });

  useEffect(() => {
    if (fastbotsConfig) {
      setEnabled(fastbotsConfig.enabled || false);
      setBotId(fastbotsConfig.botId || "");
    }
  }, [fastbotsConfig]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/settings", {
        key: "fastbots_enabled",
        value: enabled.toString(),
      });
      await apiRequest("POST", "/api/admin/settings", {
        key: "fastbots_bot_id",
        value: botId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/fastbots'] });
      toast({ 
        title: "Settings saved!",
        description: "FastBots chatbot configuration updated successfully"
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error saving settings",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">FastBots Chatbot Integration</h2>
        <p className="text-sm text-muted-foreground">
          Configure the AI chatbot that appears for all students
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          FastBots is a custom AI chatbot platform. Create your bot at{" "}
          <a 
            href="https://fastbots.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            fastbots.ai
          </a>
          {" "}and paste your Bot ID here to embed it in the student dashboard.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            ChatBot Configuration
          </CardTitle>
          <CardDescription>
            Enable and configure the FastBots chatbot for students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
              <div className="space-y-1">
                <Label htmlFor="chatbot-enabled" className="text-base font-semibold">
                  Enable Chatbot
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show the chatbot widget to all students
                </p>
              </div>
              <Switch
                id="chatbot-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                data-testid="switch-fastbots-enabled"
              />
            </div>

            {/* Bot Embed Code Input */}
            <div className="space-y-2">
              <Label htmlFor="bot-id">FastBots Embed Code</Label>
              <Input
                id="bot-id"
                data-testid="input-fastbots-bot-id"
                value={botId}
                onChange={(e) => setBotId(e.target.value)}
                placeholder='Paste full iframe code or just the bot ID'
                disabled={!enabled}
              />
              <p className="text-xs text-muted-foreground">
                Paste the full iframe embed code from FastBots, or just the bot ID
              </p>
            </div>

            {/* Preview */}
            {enabled && botId && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm font-semibold mb-2">Widget Preview:</p>
                <p className="text-xs text-muted-foreground mb-2">
                  The chatbot will appear as a floating widget in the bottom-right corner for all students.
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <Button 
                type="submit" 
                data-testid="button-save-fastbots"
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
              
              {isSaved && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Check className="h-4 w-4" />
                  <span>Saved successfully!</span>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Get Your Bot ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to <a href="https://app.fastbots.ai" target="_blank" rel="noopener noreferrer" className="underline">app.fastbots.ai</a> and create an account</li>
            <li>Create a new chatbot and train it with your content (study guides, FAQs, etc.)</li>
            <li>Customize the appearance (colors, welcome message, avatar)</li>
            <li>Go to the "Deploy" section and find the iframe embed code</li>
            <li>Copy the entire iframe code (it looks like: <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;iframe src="..."&gt;&lt;/iframe&gt;</code>)</li>
            <li>Paste the iframe code above (or just the bot ID) and enable the chatbot</li>
            <li>The chatbot will automatically appear for all students!</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
