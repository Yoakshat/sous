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
        content: `You are a smart grocery optimizer for two broke college students who want to eat well on a budget.
Given raw ingredients from multiple recipes, return the SHORTEST possible shopping list that still lets them cook everything.

Your job is to aggressively cut and consolidate:

1. SUBSTITUTIONS — pick ONE ingredient when two are interchangeable. Examples:
   - Ghee OR butter → just buy ghee (works for all Indian cooking, more versatile)
   - Heavy cream OR milk + butter → just buy milk
   - Lemon juice OR lime juice → whichever appears more, buy one
   - Vegetable oil OR canola oil → one neutral oil
   - Green onions OR regular onions → regular onions (unless green onions are the feature)

2. DROP OPTIONAL INGREDIENTS — skip things that are nice-to-have but won't ruin the dish:
   - Hing / asafoetida (cumin + garlic cover it)
   - Kasuri methi / dried fenugreek (optional garnish)
   - Fresh cilantro (skip or make it one bunch for everything)
   - Fancy garnishes (sesame seeds, pomegranate seeds, etc.)
   - Ingredients that appear in only 1 recipe AND are expensive or hard to find

3. MERGE SAME THINGS — combine only when it's literally the same ingredient:
   - "garlic cloves", "minced garlic", "garlic paste" → one garlic entry (same thing, different prep)
   - "basmati rice", "white rice" → basmati rice
   - "fresh ginger", "ginger paste" → fresh ginger
   - DO NOT merge tomatoes and tomato puree — those are different products with different uses
   - DO NOT merge fresh onions and onion powder
   - DO NOT merge coconut milk and coconut cream

4. ROUND TO REAL SHOPPING UNITS:
   - Not "2.75 tomatoes" → "3 tomatoes"
   - Not "187g chicken" → "200g chicken"
   - Not "1.5 cans" → "2 cans"

5. ASSUME a basic Indian pantry already has: salt, sugar, black pepper. Don't list those.

Return ONLY valid JSON — keep the list SHORT, practical, and budget-friendly:
{
  "categories": [
    {
      "name": "Produce",
      "items": [
        { "name": "Tomatoes", "amount": "6" },
        { "name": "Onions", "amount": "4 medium" }
      ]
    },
    { "name": "Protein", "items": [...] },
    { "name": "Dairy", "items": [...] },
    { "name": "Pantry", "items": [...] },
    { "name": "Spices", "items": [...] }
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
