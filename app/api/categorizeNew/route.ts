import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export async function POST(request: Request) {
    const { question, categories } = await request.json();

    try {
        // Prepare the prompt for categorization
        const systemPrompt = `You are an expert in the following categories: ${categories.join(", ")}. Specifically, you are excellent at classifying questions in one of those categories.`;
        console.log("Categorizing!!!!!");
        console.log("Question is", question);
        const categoryPrompt = `Use your expertise to classify the given questions's theme as one of the following: ${categories.join(", ")}. Your response should exactly match one of these categories. If none apply, return "random". The question is ${question}`;
        const chatCompletion = await client.chat.completions.create({
            messages: [
                { role: 'system', content:  systemPrompt},
                { role: 'user', content: categoryPrompt }
            ],
            model: 'gpt-3.5-turbo',
            });
        const response = chatCompletion.choices[0].message.content;
        if (response != null) {
            const category = response.trim();
            // Ensure the returned category is valid
            const isValidCategory = categories.includes(category) || category === "random";
            const finalCategory = isValidCategory ? category : "random";
            console.log("The returned category is", finalCategory);
            return NextResponse.json({ category: finalCategory });
        }
        return NextResponse.json({category: "random"});
    } catch (error: any) {
        console.log("Made it to the bad place");
        return NextResponse.json({category: "random"});
    }
}
