import readline from "readline";
import openaiSDK from "./openai.js";
import googleSDK from "./gemini.js";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function standardDeviation(values) {
  const mean = 
     values.reduce((sum, value) => sum + value, 0) /
     values.length;

  const variance =
     values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
     values.length;

  return Math.sqrt(variance);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function aggregateAnswer(answerId, evaluations) {
  const correctness = evaluations.map(
    e => e[answerId].correctness
  );

  const relevance = evaluations.map(
    e => e[answerId].relevance
  );

  const clarity = evaluations.map(
    e => e[answerId].clarity
  );

  return {
    correctness: {
      mean: average(correctness),
      disagreement: standardDeviation(correctness)
    },

    relevance: {
      mean: average(relevance),
      disagreement: standardDeviation(relevance)
    },

    clarity: {
      mean: average(clarity),
      disagreement: standardDeviation(clarity)
    },
  };

}

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

  const INDIVIDUAL_JUDGE = `You are an excellent judge, you have to score the multiple answers to the question out of 10,
  for:
  - Clarity: is it easy to undersatnd, well-organized, and unambigious?
  - Relevance: does it directly address what the question is asking?
  - Correctness: is the answer factually and logically correct?
  
  OUTPUT_FORMAT:
  {
  "answer1": {
    "correctness": 9,
    "relevance": 8,
    "clarity": 9
  },
  "answer2": {
    "correctness": 10,
    "relevance": 10,
    "clarity": 7
  },
  "answer3": {
    "correctness": 8,
    "relevance": 9,
    "clarity": 10
  }
  }

  Return ONLY valid JSON.
  Do not include markdown.
  Do not include explanations.
  `

  const judgeInput = `here is the question:
  ${question} 
  
  and the three answers:
  answer1: ${gptAnswer}
  answer2: ${claudeAnswer}
  answer3: ${geminiAnswer}`
  
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

  const [gptEval, claudeEval, geminiEval] = await Promise.all([
    openaiSDK(OPENAI_API_KEY, 'gpt-4o-mini', judgeInput ,INDIVIDUAL_JUDGE),
    openaiSDK(ANTHROPIC_API_KEY, 'claude-3-haiku', judgeInput, INDIVIDUAL_JUDGE),
    googleSDK(GEMINI_API_KEY, 'gemini-3.6-flash', judgeInput, INDIVIDUAL_JUDGE),
  ]);

  const evaluations = [
    JSON.parse(gptEval), 
    JSON.parse(claudeEval), 
    JSON.parse(geminiEval)
  ];

  const aggregatedEvaluations = {
    answer1: aggregateAnswer("answer1", evaluations),
    answer2: aggregateAnswer("answer2", evaluations),
    answer3: aggregateAnswer("answer3", evaluations),
  }

  const SYSTEM_PROMPT = `You are the final answer synthesizer.
  
  Question:
  ${question} 

  Candidate answers:

  ANSWER 1:
  ${gptAnswer}

  ANSWER 2:
  ${claudeAnswer}

  ANSWER 3:
  ${geminiAnswer}

  Individual evaluations from three independent judges:

  JUDGE 1:
  ${JSON.stringify(gptEval, null, 2)}

  JUDGE 2:
  ${JSON.stringify(claudeEval, null, 2)}

  JUDGE 3:
  ${JSON.stringify(geminiEval, null, 2)}

  Aggregated evaluation:

  ${JSON.stringify(aggregatedEvaluations, null, 2)}

  Evaluation criteria are pritorized as:

  1. Correctness
  2. Relevance
  3. Clarity

  The aggregated scores are decision aids, not absolute truth.

  Pay attention to disagreement between judges. Strong disagreement
  may indicate unsertainity or a weakness in a candidate answer.

  Independently inspect the candidate answers.

  Produce the best possible answer to the user's original question.
  You may select one answer, combine the strongest parts of multiple
  answers, or resolve conflicts between them.
  If two answers agree you may select the majority answer by combining.
  
  Do not mention the evaluation process, judges, scores, models, or
  candidate answers in your final response.
`;

  const finalAnswer = await googleSDK(GEMINI_API_KEY, 'gemini-3.6-flash', SYSTEM_PROMPT)

  console.log(`Judge:`, finalAnswer);

  r1.close();
});
