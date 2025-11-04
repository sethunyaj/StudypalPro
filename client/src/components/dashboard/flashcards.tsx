import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, RotateCw, Check, X, ChevronLeft, ChevronRight, Brain } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FlashcardsProps {
  userId: string;
}

export default function Flashcards({ userId }: FlashcardsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState("");

  const { data: flashcards } = useQuery({
    queryKey: ['/api/flashcards', userId],
  });

  const { data: dueCards } = useQuery({
    queryKey: ['/api/flashcards/due', userId],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/flashcards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due', userId] });
      toast({ title: "Flashcard created!" });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, quality }: any) => apiRequest("POST", `/api/flashcards/${id}/review`, { quality }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due', userId] });
    },
  });

  const resetForm = () => {
    setFront("");
    setBack("");
    setSubject("");
    setTags("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      userId,
      front,
      back,
      subject,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
  };

  const handleReview = (quality: number) => {
    if (reviewCards && reviewCards[currentCardIndex]) {
      reviewMutation.mutate({
        id: reviewCards[currentCardIndex].id,
        quality,
      });
      
      if (currentCardIndex < reviewCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        toast({ title: "Review complete!", description: "Great job! Come back tomorrow for more." });
        setReviewMode(false);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    }
  };

  const reviewCards = dueCards || [];
  const currentCard = reviewMode && reviewCards[currentCardIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Flashcards</h2>
          <p className="text-sm text-muted-foreground">Spaced repetition for better retention</p>
        </div>
        <div className="flex gap-2">
          {reviewCards.length > 0 && !reviewMode && (
            <Button
              variant="default"
              onClick={() => setReviewMode(true)}
              data-testid="button-start-review"
            >
              <Brain className="h-4 w-4 mr-2" />
              Review {reviewCards.length} Cards
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-flashcard">
                <Plus className="h-4 w-4 mr-2" />
                New Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Flashcard</DialogTitle>
                <DialogDescription>Add a new flashcard to your collection</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="front">Question / Front</Label>
                  <Textarea
                    id="front"
                    data-testid="textarea-card-front"
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder="What's on the front of the card?"
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="back">Answer / Back</Label>
                  <Textarea
                    id="back"
                    data-testid="textarea-card-back"
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="What's the answer?"
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    data-testid="input-card-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Biology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    data-testid="input-card-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="cell, mitosis, chapter5"
                  />
                </div>
                <Button type="submit" data-testid="button-save-flashcard" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Card"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Review Mode */}
      {reviewMode && currentCard ? (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Card {currentCardIndex + 1} of {reviewCards.length}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReviewMode(false);
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
            >
              Exit Review
            </Button>
          </div>
          
          <Progress value={((currentCardIndex + 1) / reviewCards.length) * 100} className="h-2" />

          <div
            className="relative h-96 cursor-pointer perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
            data-testid="flashcard-review"
          >
            <div
              className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front */}
              <Card className={`absolute inset-0 backface-hidden ${isFlipped ? 'invisible' : ''}`}>
                <CardContent className="h-full flex flex-col items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground mb-4">Question</p>
                  <p className="text-xl text-center font-medium">{currentCard.front}</p>
                  <p className="text-sm text-muted-foreground mt-8">Click to reveal answer</p>
                </CardContent>
              </Card>

              {/* Back */}
              <Card className={`absolute inset-0 backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : ''}`}>
                <CardContent className="h-full flex flex-col items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground mb-4">Answer</p>
                  <p className="text-xl text-center font-medium">{currentCard.back}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {isFlipped && (
            <div className="flex justify-center gap-3">
              <Button
                variant="destructive"
                size="lg"
                onClick={() => handleReview(0)}
                data-testid="button-review-again"
              >
                <X className="h-5 w-5 mr-2" />
                Again
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleReview(3)}
                data-testid="button-review-hard"
              >
                Hard
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleReview(4)}
                data-testid="button-review-good"
              >
                Good
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={() => handleReview(5)}
                data-testid="button-review-easy"
              >
                <Check className="h-5 w-5 mr-2" />
                Easy
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Card List */
        <div>
          {dueCards && dueCards.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-chart-1/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {dueCards.length} Cards Due for Review
                </CardTitle>
                <CardDescription>
                  Keep up your momentum! Review these cards to strengthen your memory.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcards && flashcards.length > 0 ? (
              flashcards.map((card: any) => (
                <Card key={card.id} className="hover-elevate" data-testid={`flashcard-${card.id}`}>
                  <CardHeader className="pb-3">
                    {card.subject && (
                      <Badge variant="secondary" className="w-fit mb-2">{card.subject}</Badge>
                    )}
                    <CardTitle className="text-sm font-medium line-clamp-2">{card.front}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{card.back}</p>
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {card.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first flashcard to start learning
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Flashcard
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
