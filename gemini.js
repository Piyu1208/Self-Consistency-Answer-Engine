import { GoogleGenAI } from "@google/genai";


async function googleSDK(apiKey, model, input) {
  const client = new GoogleGenAI({ apiKey: apiKey });

  const interaction = await client.interactions.create({
    model: `${model}`,
    input: `${input}`,
  });

  return interaction.output_text;
}


export default googleSDK;

