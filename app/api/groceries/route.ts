import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { ingredients } = await req.json() as { ingredients: string[] };

  const res = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `You are a smart grocery list consolidator.
Given a raw list of ingredients from multiple recipes (for 2 people), return a clean, practical shopping list.

Rules:
- Merge duplicates and similar items (e.g. "1 tomato", "2 tomatoes", "diced tomato" → one entry)
- Combine quantities where possible (1 cup rice + 2 cups rice = 3 cups rice)
- Round to practical shopping amounts (not "2.75 tomatoes" → "3 tomatoes", not "187g chicken" → "200g chicken")
- Use real-world units a person would buy (cups, grams, pieces, cans, bunches)
- Group items by category

Return ONLY valid JSON:
{
  "categories": [
    {
      "name": "Produce",
      "items": [
        { "name": "Tomatoes", "amount": "6" },
        { "name": "Onions", "amount": "4 medium" }
      ]
    },
    {
      "name": "Pantry",
      "items": [...]
    },
    {
      "name": "Protein",
      "items": [...]
    },
    {
      "name": "Dairy",
      "items": [...]
    },
    {
      "name": "Spices",
      "items": [...]
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Here are all the raw ingredients from the selected recipes:\n\n${ingredients.join("\n")}`,
      },
    ],
    temperature: 0.1,
  });

  const text = res.choices[0].message.content ?? "null";
  const data = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  return NextResponse.json(data);
}
