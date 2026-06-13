"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { type Recipe, scaledIngredients } from "@/lib/scale";

export default function CookPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("selectedRecipes");
    if (!saved) return;
    const recipes: Recipe[] = JSON.parse(saved);
    setRecipe(recipes.find((r) => r.id === id) ?? null);
  }, [id]);

  if (!recipe) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <p className="text-zinc-500">recipe not found</p>
      </main>
    );
  }

  const scaled = scaledIngredients(recipe);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white pb-12">
      <div className="px-6 pt-12 pb-6 flex items-start justify-between gap-4">
        <div>
          <span className="text-5xl">{recipe.emoji}</span>
          <h1 className="text-2xl font-bold mt-3 leading-tight">{recipe.name}</h1>
          <p className="text-zinc-400 text-sm mt-1">{recipe.description}</p>
          <div className="flex gap-3 mt-2 text-xs text-zinc-500">
            <span>{recipe.time}</span>
            <span>·</span>
            <span>{recipe.cuisine}</span>
            <span>·</span>
            <span>serves 2 (original: {recipe.originalServings})</span>
          </div>
        </div>
        <Link href="/schedule" className="text-xs text-zinc-500 underline shrink-0">← week</Link>
      </div>

      <div className="px-6 flex flex-col gap-8">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Ingredients for 2</h2>
          <ul className="space-y-2">
            {scaled.map((ing, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-3">
                <span className="text-zinc-600 mt-0.5">•</span>
                {ing}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Steps</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="text-zinc-600 font-mono text-sm shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-zinc-300 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}
