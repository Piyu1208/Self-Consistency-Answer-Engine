# Self-Consistency Engine

A console-based AI self-consistency engine that generates multiple answers to a question using different LLMs, has independent AI judges evaluate those answers, aggregates the evaluation scores, and synthesizes a final answer using the strongest available reasoning.


## How It Works

The engine follows a multi-stage pipeline:

```text
User Question
      │
      ▼
┌─────────────────────────────┐
│  Generate Candidate Answers │
│                             │
│  • GPT                      │
│  • Claude                   │
│  • Gemini                   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Independent Evaluation      │
│                             │
│ Each model scores every     │
│ answer on:                  │
│ • Correctness               │
│ • Relevance                 │
│ • Clarity                   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Score Aggregation           │
│                             │
│ • Mean score                │
│ • Judge disagreement        │
│   (standard deviation)      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Final Answer Synthesizer    │
│                             │
│ Inspects answers, scores,   │
│ and disagreements to create │
│ the best possible response. │
└──────────────┬──────────────┘
               │
               ▼
           Final Answer
```

## Features

* Generates answers from multiple LLMs in parallel.
* Uses independent AI judges to evaluate all candidate answers.
* Scores answers based on:

  * **Correctness**
  * **Relevance**
  * **Clarity**
* Aggregates scores using the mean.
* Measures disagreement between judges using standard deviation.
* Gives higher priority to correctness, followed by relevance and clarity.
* Allows the final model to independently inspect and synthesize the answers instead of blindly selecting the highest-scoring one.
* Runs entirely from the terminal.

## Architecture

### 1. Answer Generation

When a user enters a question, the engine sends it to three different models simultaneously:

* GPT
* Claude
* Gemini

Using `Promise.all()`, the requests run concurrently:

```js
const [gptAnswer, geminiAnswer, claudeAnswer] = await Promise.all([
  openaiSDK(OPENAI_API_KEY, "gpt-4o-mini", question),
  openaiSDK(OPENAI_API_KEY, "claude-3-haiku", question),
  googleSDK(GEMINI_API_KEY, "gemini-3.6-flash", question),
]);
```

This produces three independent candidate answers.

---

### 2. Independent Evaluation

The same candidate answers are then evaluated by three independent judges.

Each judge scores every answer from **0–10** on:

| Criterion   | Description                                                |
| ----------- | ---------------------------------------------------------- |
| Correctness | Is the answer factually and logically correct?             |
| Relevance   | Does it directly answer the user's question?               |
| Clarity     | Is it easy to understand, well-organized, and unambiguous? |

The judges return structured JSON in the following format:

```json
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
```

This results in three separate evaluations for each candidate answer.

---

### 3. Score Aggregation

The engine aggregates the evaluations across all judges.

For each answer and evaluation criterion, it calculates:

#### Mean Score

```text
mean = sum of all scores / number of judges
```

The mean represents the overall evaluation of an answer.

#### Disagreement

Disagreement is measured using standard deviation:

```text
σ = √(Σ(x - μ)² / N)
```

A low standard deviation means the judges generally agree.

A high standard deviation indicates significant disagreement or uncertainty about the quality of the answer.

The aggregated result looks like:

```json
{
  "answer1": {
    "correctness": {
      "mean": 9,
      "disagreement": 0.81
    },
    "relevance": {
      "mean": 8.67,
      "disagreement": 0.47
    },
    "clarity": {
      "mean": 8.33,
      "disagreement": 1.24
    }
  }
}
```

---

### 4. Final Answer Synthesis

The final model receives:

* The original user question.
* All three candidate answers.
* Individual evaluations from every judge.
* Aggregated mean scores.
* Disagreement scores.

The evaluation criteria are prioritized as:

```text
1. Correctness
2. Relevance
3. Clarity
```

However, the scores are treated as **decision aids rather than absolute truth**.

The final model independently inspects the candidate answers and can:

* Select the strongest answer.
* Combine the best parts of multiple answers.
* Resolve conflicts between answers.
* Prefer consensus when multiple answers agree.
* Avoid answers where high judge disagreement indicates uncertainty.

The final response does not mention:

* The candidate models.
* The judges.
* Evaluation scores.
* The internal decision-making process.

The user simply receives the best synthesized answer.

## Project Structure

```text
self-consistency-engine/
│
├── index.js          # Main application logic
├── openai.js         # OpenAI/compatible SDK wrapper
├── gemini.js         # Gemini SDK wrapper
├── .env              # API keys
├── package.json
└── README.md
```

## Installation

Clone the repository:

```bash
git clone https://github.com/Piyu1208/Self-Consistency-Answer-Engine
```

Move into the project directory:

```bash
cd self-consistency-engine
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key

GEMINI_API_KEY=your_gemini_api_key
```

Make sure your `.env` file is included in `.gitignore`:

```text
.env
```

## Running the Project

Start the application:

```bash
node index.js
```

You will be prompted with:

```text
Ask a question.
```

Enter any question:

```text
Ask a question. What is the difference between REST and GraphQL?
```

The engine will:

1. Generate answers from multiple models.
2. Print the candidate answers to the console.
3. Have multiple models independently evaluate the answers.
4. Aggregate the evaluation scores.
5. Generate a final synthesized response.


## Why Self-Consistency?

A single model response can be affected by:

* Hallucinations.
* Incorrect reasoning.
* Missing context.
* Ambiguous interpretations.
* Model-specific biases.

Instead of relying on one model, this project creates multiple independent candidate answers and evaluates them from different perspectives.

The core idea is:

> **Multiple independent answers + multiple independent evaluations can provide a stronger basis for generating a final response than relying on a single model output.**

The engine does not assume that the answer with the highest score is automatically correct. The final synthesizer still independently examines all available information before producing the final response.

## Evaluation Strategy

The engine uses two signals when evaluating candidate answers:

### Quality

Measured using the average score across independent judges.

```text
Higher mean = stronger overall evaluation
```

### Agreement

Measured using standard deviation.

```text
Lower disagreement = stronger consensus between judges
```

For example:

```text
Answer A

Correctness:
Mean: 9.3
Disagreement: 0.4
```

This indicates that the answer was rated highly and the judges largely agreed.

```text
Answer B

Correctness:
Mean: 9.0
Disagreement: 2.8
```

Although the average score is high, the large disagreement suggests that some judges strongly disagreed about its correctness.

The final synthesizer can use this disagreement as an additional uncertainty signal.

## Current Models

The current implementation uses:

| Purpose           | Model  |
| ----------------- | ------ |
| Candidate Answer  | GPT    |
| Candidate Answer  | Claude |
| Candidate Answer  | Gemini |
| Judge             | GPT    |
| Judge             | Claude |
| Judge             | Gemini |
| Final Synthesizer | Gemini |

The models can easily be replaced by modifying the model names in `index.js`.

## Possible Improvements

Some potential future improvements include:

* [ ] Add more models.
* [ ] Support multiple rounds of debate.
* [ ] Add weighted scoring for different judges.
* [ ] Add confidence estimation.
* [ ] Detect malformed JSON from judges.
* [ ] Add retry logic for failed API calls.
* [ ] Add structured output validation.
* [ ] Add support for streaming responses.
* [ ] Save questions, answers, and evaluations to a database.
* [ ] Build a web interface.
* [ ] Add cost and latency tracking.
* [ ] Dynamically select models based on the type of question.
* [ ] Use weighted aggregation instead of a simple mean.
* [ ] Add a mechanism to identify and resolve factual conflicts using external sources.

## Limitations

This project does **not guarantee correctness**.

Multiple models can still:

* Make the same mistake.
* Agree on incorrect information.
* Produce biased evaluations.
* Hallucinate facts.

Consensus should therefore be treated as an additional signal, not as proof of truth.

For factual or high-stakes questions, the system could be improved by adding retrieval, external verification, or trusted knowledge sources.

## Tech Stack

* Node.js
* JavaScript
* OpenAI-compatible SDK
* Google Gemini API
* Anthropic-compatible API access
* dotenv
* readline

## License

This project is available for educational and experimental purposes.


# 👨‍💻 Author

Built by **Piyush Sharma**


Built as an experiment in **multi-model reasoning, AI evaluation, consensus, disagreement measurement, and answer synthesis**
