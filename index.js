import readline from "readline";
import openaiSDK from "./openai.js";
import googleSDK from "./gemini.js";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

r1.question("Ask a question.   ", async (question) => {
  const [gptAnswer, geminiAnswer, claudeAnswer] = await Promise.all([
    openaiSDK(OPENAI_API_KEY, 'gpt-4o-mini', question),
    openaiSDK(ANTHROPIC_API_KEY, 'claude-3-haiku', question),
    googleSDK(GEMINI_API_KEY, 'gemini-3.6-flash', question),
  ]);


  const SYSTEM_PROMPT = `You are an excellent judge, evaluator. Here is the question:
${question} 
and 3 answers to this question:
Answer 1: ${gptAnswer}

Answer 2: ${claudeAnswer}

Answer 3: ${geminiAnswer}

First evaluate the question, for what it is, whether it is a:
- maths question
- scientific question
- coding/programming question
- reasoning question
- philosphy question
- a general life advice
- a factual question

According to the question type evaluate each answer for:
- truthness, if it is a fact.
- reasoning, if it is a reasoning question.
- logic and complexity, if it is a coding/programming question.
- concept, reasoning, premises justified, it's commitment coherent, and it can
  survive serious objections rather than its alternatives, if it is a philosphical question.
- if it has worked for the masses, if it is a general life advice.
- if the statement is true, if it's a fact.

Thus on this basis rate each answer out of 10.
`;

  console.log(`GPT's answer(1):`, gptAnswer);
  console.log(
    "_____________________________________________________________________________________________",
  );
  console.log(`Claude's answer(2):`, claudeAnswer);
  console.log(
    "_____________________________________________________________________________________________",
  );
  console.log(`Gemini's answer(3):`, geminiAnswer);
  console.log(
    "_____________________________________________________________________________________________",
  );

  const finalAnswer = await googleSDK(GEMINI_API_KEY, 'gemini-3.6-flash', SYSTEM_PROMPT)


  console.log(`Judge:`, finalAnswer);

  r1.close();
});
