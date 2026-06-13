import OpenAI from "openai";
import FirecrawlApp from "@mendable/firecrawl-js";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // Step 1: Get 32 search queries from DeepSeek — mostly Indian
        const planRes = await deepseek.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a meal planner for two beginner Indian-American college students in San Francisco.
Goal: minimize total unique ingredients across the week by choosing recipes with lots of overlap.
Generate 32 recipe search queries — 16 lunch and 16 dinner.
- ~22 should be Indian/South Asian (dal, sabzi, rice dishes, rotis, etc.) — these share pantry staples
- ~10 can be other cuisines (Mexican, Mediterranean, Italian) that naturally share ingredients with Indian cooking (tomatoes, onions, garlic, cumin, etc.)
All recipes must be: beginner-friendly, under 45 min, few ingredients.
Return ONLY valid JSON:
{
  "lunch": ["query1", ..., "query16"],
  "dinner": ["query1", ..., "query16"]
}`,
            },
            { role: "user", content: "Generate the queries." },
          ],
          temperature: 0.8,
        });

        const raw = planRes.choices[0].message.content ?? '{"lunch":[],"dinner":[]}';
        const { lunch, dinner } = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());

        const queries = [
          ...lunch.map((q: string) => ({ query: q, meal: "lunch" })),
          ...dinner.map((q: string) => ({ query: q, meal: "dinner" })),
        ];

        // Step 2: Run all searches + extractions in parallel, stream each result as it lands
        await Promise.all(
          queries.map(async ({ query, meal }) => {
            try {
              const searchResult = await firecrawl.search(query, {
                limit: 1,
                scrapeOptions: { formats: ["markdown"] },
              });
              const page = searchResult.web?.[0] as { url?: string; markdown?: string } | undefined;
              if (!page?.url) return;

              const extractRes = await deepseek.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                  {
                    role: "system",
                    content: `Extract a recipe from this page EXACTLY as written — do NOT scale anything.
Return ONLY valid JSON:
{
  "name": "Recipe Name",
  "cuisine": "Indian/Mexican/etc",
  "time": "30 min",
  "difficulty": "Easy",
  "originalServings": 4,
  "description": "One enticing sentence",
  "ingredients": [
    { "amount": 2, "unit": "cups", "name": "basmati rice" },
    { "amount": 1, "unit": "tbsp", "name": "oil" },
    { "amount": 0, "unit": "", "name": "salt to taste" }
  ],
  "steps": ["Step 1...", "Step 2..."],
  "emoji": "🍛"
}
Rules:
- originalServings: the number of people the recipe serves AS WRITTEN on the page
- ingredients: structured objects — amount as a number (use 0 if none, e.g. "salt to taste"), unit as string, name as string
- DO NOT change any quantities — copy them exactly from the source
If no clear recipe found, return null.`,
                  },
                  {
                    role: "user",
                    content: `Query: ${query}\nURL: ${page.url}\n\n${page.markdown?.slice(0, 3000) ?? ""}`,
                  },
                ],
                temperature: 0.2,
              });

              const text = extractRes.choices[0].message.content ?? "null";
              const recipe = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
              if (!recipe) return;

              send({ ...recipe, meal, url: page.url, id: crypto.randomUUID() });
            } catch {
              // skip failed recipes silently
            }
          })
        );
      } catch (err) {
        send({ error: String(err) });
      }

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
