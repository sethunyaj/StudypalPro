import OpenAI from "openai";
import type { QuizQuestion, TrainingQuizQuestion } from "@shared/schema";

// Initialize OpenAI client using Replit AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Generate AI-powered quiz questions
export async function generateQuiz(params: {
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  numQuestions: number;
  sourceNoteContent?: string;
}): Promise<QuizQuestion[]> {
  const { subject, difficulty, numQuestions, sourceNoteContent } = params;

  const difficultyPrompts = {
    easy: "basic recall and understanding, suitable for beginners",
    medium: "application and analysis, standard understanding required",
    hard: "advanced application, synthesis, and evaluation",
    expert: "critical thinking, complex problem-solving, and deep analysis"
  };

  const contextInfo = sourceNoteContent 
    ? `Base the questions on this content:\n\n${sourceNoteContent}\n\n`
    : '';

  const prompt = `You are an expert educator creating a quiz on ${subject}. 
${contextInfo}
Generate ${numQuestions} high-quality quiz questions at ${difficulty} difficulty level (${difficultyPrompts[difficulty]}).

Mix question types:
- Multiple choice (with 4 options)
- True/False
- Fill in the blank
- Short answer

For each question, provide:
1. The question text
2. The correct answer
3. A clear, educational explanation
4. For multiple choice, provide 4 plausible options

Return ONLY a valid JSON array with this exact structure:
[
  {
    "type": "multiple_choice" | "true_false" | "fill_blank" | "short_answer",
    "question": "question text",
    "options": ["option1", "option2", "option3", "option4"], // only for multiple_choice
    "correctAnswer": "the correct answer",
    "explanation": "why this is the answer and educational context",
    "difficulty": "${difficulty}"
  }
]`;

  try {
    console.log("Calling OpenAI for quiz generation...");
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert educator who creates challenging, context-aware quiz questions. Always respond with valid JSON only. Do not wrap JSON in markdown code fences." },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: 4096,
      temperature: 0.7,
    });

    const elapsed = Date.now() - startTime;
    console.log(`OpenAI response received in ${elapsed}ms:`, {
      hasChoices: !!completion.choices,
      choicesLength: completion.choices?.length,
      hasContent: !!completion.choices?.[0]?.message?.content
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error("No content in OpenAI response:", JSON.stringify(completion, null, 2));
      throw new Error("No response from AI");
    }

    console.log("Parsing OpenAI JSON response...");
    const cleanedContent = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '').trim();
    const questions = JSON.parse(cleanedContent) as QuizQuestion[];
    console.log("Successfully generated", questions.length, "questions");
    
    return questions.map((q, idx) => ({
      ...q,
      id: `q_${Date.now()}_${idx}`,
    }));
  } catch (error) {
    console.error("Quiz generation error:", error);
    if (error instanceof Error) {
      console.error("Error details:", { name: error.name, message: error.message, stack: error.stack });
    }
    throw new Error("Failed to generate quiz. Please try again.");
  }
}

// Generate training quiz questions (MCQ format for Training Hub)
export async function generateTrainingQuiz(params: {
  topic: string;
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}): Promise<TrainingQuizQuestion[]> {
  const { topic, numQuestions, difficulty } = params;

  const prompt = `Generate ${numQuestions} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level.

Each question must have exactly 4 options and one correct answer.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct"
  }
]

Where correctAnswer is the zero-based index of the correct option (0-3).`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert educator creating quiz questions. Always respond with valid JSON only. Do not wrap JSON in markdown code fences." },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: 4096,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const cleanedContent = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '').trim();
    const questions = JSON.parse(cleanedContent) as Omit<TrainingQuizQuestion, 'id'>[];

    return questions.map((q, idx) => ({
      ...q,
      id: `tq_${Date.now()}_${idx}`,
    }));
  } catch (error) {
    console.error("Training quiz generation error:", error);
    throw new Error("Failed to generate quiz questions. Please try again.");
  }
}

// Summarize notes content
export async function summarizeNotes(content: string, title: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert educator who creates clear, concise summaries. Use bullet points and highlight key concepts. Format with markdown." },
        { role: "user", content: `Summarize the following study notes titled "${title}":\n\n${content}` }
      ],
      max_completion_tokens: 2048,
      temperature: 0.5,
    });
    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("No response from AI");
    return response;
  } catch (error) {
    console.error("Summarize error:", error);
    throw new Error("Failed to summarize notes. Please try again.");
  }
}

// Generate study guide from notes
export async function generateStudyGuide(content: string, title: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert educator who creates comprehensive study guides. Include key concepts, definitions, important relationships, practice questions, and memory aids. Format with markdown headings and bullet points." },
        { role: "user", content: `Create a detailed study guide from these notes titled "${title}":\n\n${content}\n\nInclude:\n1. Key Concepts & Definitions\n2. Important Relationships & Connections\n3. Quick Review Points\n4. Practice Questions (with answers)\n5. Memory Tips & Mnemonics` }
      ],
      max_completion_tokens: 4096,
      temperature: 0.6,
    });
    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("No response from AI");
    return response;
  } catch (error) {
    console.error("Study guide error:", error);
    throw new Error("Failed to generate study guide. Please try again.");
  }
}

// Generate flashcards from notes
export async function generateFlashcardsFromNotes(content: string, title: string): Promise<{ front: string; back: string }[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert educator creating flashcards for spaced repetition study. Create clear question/answer pairs that test key concepts. Always respond with valid JSON only. Do not wrap JSON in markdown code fences." },
        { role: "user", content: `Create flashcards from these study notes titled "${title}":\n\n${content}\n\nGenerate 8-15 flashcards covering the most important concepts. Each flashcard should have a clear question on the front and a concise answer on the back.\n\nReturn ONLY a valid JSON array:\n[\n  { "front": "Question text", "back": "Answer text" }\n]` }
      ],
      max_completion_tokens: 4096,
      temperature: 0.6,
    });
    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("No response from AI");
    const cleaned = response.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Flashcard generation error:", error);
    throw new Error("Failed to generate flashcards. Please try again.");
  }
}

// Generate podcast script from notes
export async function generatePodcastScript(content: string, title: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a friendly, engaging podcast host who explains educational topics clearly. Create a natural, conversational script that a student would enjoy listening to. Keep it informative but casual." },
        { role: "user", content: `Convert these study notes titled "${title}" into an engaging podcast-style script that explains the material clearly:\n\n${content}\n\nMake it sound natural, like a knowledgeable friend explaining the topic. Include:\n- A brief intro\n- Main concepts explained conversationally\n- Key takeaways at the end\n\nKeep it concise (2-3 minutes when read aloud). Do not include stage directions or speaker labels - just the spoken text.` }
      ],
      max_completion_tokens: 2048,
      temperature: 0.7,
    });
    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("No response from AI");
    return response;
  } catch (error) {
    console.error("Podcast script error:", error);
    throw new Error("Failed to generate podcast script. Please try again.");
  }
}

// Generate illustration prompt from notes
export async function generateIllustrationPrompt(content: string, title: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You create detailed image generation prompts for educational illustrations. Create a prompt that would produce a clear, informative visual aid for studying." },
        { role: "user", content: `Create a detailed image generation prompt for an educational illustration based on these study notes titled "${title}":\n\n${content}\n\nThe illustration should visually represent the key concepts in a clear, educational infographic style. Return ONLY the image prompt text, nothing else. Make it detailed enough for an AI image generator.` }
      ],
      max_completion_tokens: 500,
      temperature: 0.7,
    });
    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("No response from AI");
    return response;
  } catch (error) {
    console.error("Illustration prompt error:", error);
    throw new Error("Failed to generate illustration. Please try again.");
  }
}


// AI Tutor chat completion
export async function getTutorResponse(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}): Promise<string> {
  const { messages } = params;

  const systemMessage = {
    role: 'system' as const,
    content: `You are a helpful, patient, and knowledgeable AI tutor. Your role is to:
1. Help students understand concepts through clear explanations
2. Provide step-by-step problem-solving guidance
3. Encourage critical thinking by asking guiding questions
4. Adapt explanations to the student's level
5. Be supportive and motivating
6. Never just give answers - help students learn to solve problems themselves

Keep responses concise but thorough. Use examples when helpful.`
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [systemMessage, ...messages],
      max_completion_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error("No response from AI tutor");

    return response;
  } catch (error) {
    console.error("AI tutor error:", error);
    throw new Error("AI tutor is temporarily unavailable. Please try again.");
  }
}
