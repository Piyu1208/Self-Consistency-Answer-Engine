import { GoogleGenAI } from "@google/genai";


async function googleSDK(apiKey, model, input, system_instruction) {
  const client = new GoogleGenAI({ apiKey: apiKey });

  const interaction = await client.interactions.create({
    model: `${model}`,
    input: `${input}`,
    system_instruction: system_instruction || '',
  });

  return interaction.output_text;
}


export default googleSDK;

