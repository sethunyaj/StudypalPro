import OpenAI from "openai";
import type { QuizQuestion } from "@shared/schema";

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
