import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Plus } from "lucide-react";

interface MindMapProps {
  userId: string;
}

export default function MindMap({ userId }: MindMapProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mind Maps</h2>
          <p className="text-sm text-muted-foreground">Visualize your ideas and connections</p>
        </div>
        <Button data-testid="button-create-mind-map">
          <Plus className="h-4 w-4 mr-2" />
          New Mind Map
        </Button>
      </div>

      <Card className="p-12 text-center">
        <Lightbulb className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Mind Mapping Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          Create visual diagrams to organize your thoughts and study materials
        </p>
      </Card>
    </div>
  );
}
