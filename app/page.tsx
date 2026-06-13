"use client";

import { useState, useEffect, useRef } from "react";
import { type Recipe, scaledIngredients } from "@/lib/scale";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("weeklyRecipes");
    if (saved) {
      const parsed = JSON.parse(saved);
      setRecipes(parsed);
      const savedSel = localStorage.getItem("weeklySelected");
      if (savedSel) setSelected(new Set(JSON.parse(savedSel)));
    }
  }, []);

  function fetchRecipes() {
    if (sourceRef.current) sourceRef.current.close();
    setLoading(true);
    setRecipes([]);
    setSelected(new Set());
    setExpanded(null);
    localStorage.removeItem("weeklyRecipes");
    localStorage.removeItem("weeklySelected");

    const es = new EventSource("/api/recipes");
    sourceRef.current = es;
    const collected: Recipe[] = [];

    es.onmessage = (e) => {
      if (e.data === "[DONE]") {
        es.close();
        setLoading(false);
        localStorage.setItem("weeklyRecipes", JSON.stringify(collected));
        return;
      }
      try {
        const recipe: Recipe = JSON.parse(e.data);
        if (recipe.id) {
          collected.push(recipe);
          setRecipes((prev) => [...prev, recipe]);
        }
      } catch {
        // skip malformed
      }
    };

    es.onerror = () => {
      es.close();
      setLoading(false);
    };
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("weeklySelected", JSON.stringify([...next]));
      return next;
    });
  }

  function scheduleWeek() {
    const chosenRecipes = recipes.filter((r) => selected.has(r.id));
    localStorage.setItem("selectedRecipes", JSON.stringify(chosenRecipes));
    window.location.href = "/schedule";
  }

  const lunches = recipes.filter((r) => r.meal === "lunch");
  const dinners = recipes.filter((r) => r.meal === "dinner");
  const selectedLunches = lunches.filter((r) => selected.has(r.id)).length;
  const selectedDinners = dinners.filter((r) => selected.has(r.id)).length;

  function RecipeCard({ recipe }: { recipe: Recipe }) {
    const isSelected = selected.has(recipe.id);
    const isExpanded = expanded === recipe.id;
    return (
      <div className={`rounded-2xl border transition-all ${isSelected ? "border-white bg-zinc-900" : "border-zinc-800 bg-zinc-950"}`}>
        <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={() => toggleSelect(recipe.id)}>
          <span className="text-3xl mt-0.5">{recipe.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate">{recipe.name}</h3>
              {isSelected && (
                <span className="shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-sm mt-0.5 leading-snug">{recipe.description}</p>
            <div className="flex gap-3 mt-2 text-xs text-zinc-500">
              <span>{recipe.time}</span>
              <span>·</span>
              <span>{recipe.cuisine}</span>
              <span>·</span>
              <span>{recipe.difficulty}</span>
            </div>
            {recipe.url && (
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-1 text-xs text-zinc-600 underline truncate block"
              >
                {(() => { try { return new URL(recipe.url).hostname; } catch { return recipe.url; } })()}
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(isExpanded ? null : recipe.id)}
          className="w-full px-4 pb-3 text-left text-xs text-zinc-500"
        >
          {isExpanded ? "▲ hide details" : "▼ ingredients & steps"}
        </button>
        {isExpanded && (
          <div className="px-4 pb-5 space-y-4 border-t border-zinc-800 pt-4">
            <div>
              <p className="text-xs uppercase text-zinc-500 font-semibold mb-2">
                Ingredients (scaled for 2, original: {recipe.originalServings})
              </p>
              <ul className="space-y-1">
                {scaledIngredients(recipe).map((ing, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex gap-2">
                    <span className="text-zinc-600">•</span>{ing}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500 font-semibold mb-2">Steps</p>
              <ol className="space-y-2">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex gap-3">
                    <span className="text-zinc-600 shrink-0 font-mono">{i + 1}.</span>{step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white pb-32">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold tracking-tight">sous</h1>
        <p className="text-zinc-400 text-sm mt-1">your kitchen companion</p>
      </div>

      <div className="px-6 mb-8">
        <button
          onClick={fetchRecipes}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading
            ? `finding recipes… (${recipes.length} so far)`
            : recipes.length
            ? "regenerate options"
            : "find recipes for this week"}
        </button>
      </div>

      {recipes.length > 0 && (
        <div className="px-4 flex flex-col gap-6">
          <p className="px-2 text-zinc-400 text-sm">
            pick what you want · {selectedLunches}L + {selectedDinners}D selected
            {loading && <span className="ml-2 text-zinc-600">· loading more…</span>}
          </p>

          {lunches.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="px-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                ☀️ Lunch options ({lunches.length})
              </h2>
              {lunches.map((r) => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          )}

          {dinners.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="px-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                🌙 Dinner options ({dinners.length})
              </h2>
              {dinners.map((r) => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          )}
        </div>
      )}

      {!loading && recipes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8 gap-3">
          <span className="text-5xl">🍳</span>
          <p className="text-zinc-300 font-medium">what are we cooking this week?</p>
          <p className="text-zinc-500 text-sm">we&apos;ll find ~30 options — mostly Indian so ingredients overlap</p>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f] to-transparent pt-8">
          <button
            onClick={scheduleWeek}
            className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-base active:scale-95 transition-transform"
          >
            schedule {selected.size} meals →
          </button>
        </div>
      )}
    </main>
  );
}
