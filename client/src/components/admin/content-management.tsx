import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ContentManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content Management</h2>
        <p className="text-sm text-muted-foreground">
          Create and manage study materials for students
        </p>
      </div>

      <Card className="p-12 text-center">
        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Content Management Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          Create quizzes, flashcards, and study materials for your students
        </p>
      </Card>
    </div>
  );
}
