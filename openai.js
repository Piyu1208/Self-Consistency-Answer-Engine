import OpenAI from "openai";


async function openaiSDK(apiKey, model, input, instructions) {

    const client = new OpenAI({
        baseURL: `https://aicredits.in/v1`,
        apiKey: apiKey,
    });

    const response = await client.responses.create({
        model: `${model}`,
        instructions: instructions || '',
        input: `${input}`,
    });

    return response.output_text;
}


export default openaiSDK;


