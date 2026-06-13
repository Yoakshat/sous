"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Recipe, scaledIngredients } from "@/lib/scale";

interface GroceryItem {
  name: string;
  amount: string;
}

interface GroceryCategory {
  name: string;
  items: GroceryItem[];
}


export default function GroceriesPage() {
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [recipeNames, setRecipeNames] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("selectedRecipes");
    if (!saved) { setLoading(false); return; }
    const recipes: Recipe[] = JSON.parse(saved);
    setRecipeNames(recipes.map((r) => `${r.emoji} ${r.name}`));

    const allIngredients = recipes.flatMap((r) => scaledIngredients(r));

    fetch("/api/groceries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: allIngredients }),
    })
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
  const remaining = totalItems - checked.size;

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white pb-12">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">groceries</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {loading ? "building your list…" : remaining > 0 ? `${remaining} items left` : "all done! 🎉"}
          </p>
        </div>
        <Link href="/schedule" className="text-xs text-zinc-500 underline">← week</Link>
      </div>

      {recipeNames.length > 0 && (
        <div className="px-6 mb-6 flex flex-wrap gap-2">
          {recipeNames.map((name, i) => (
            <span key={i} className="text-xs bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-zinc-400">
              {name}
            </span>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">merging & simplifying your grocery list…</p>
        </div>
      )}

      {!loading && categories.length > 0 && (
        <div className="px-4 flex flex-col gap-6">
          {categories.map((cat) => (
            <div key={cat.name}>
              <h2 className="px-2 mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {cat.name}
              </h2>
              <div className="flex flex-col gap-1">
                {cat.items.map((item) => {
                  const key = `${cat.name}:${item.name}`;
                  const done = checked.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggle(key)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-opacity ${done ? "opacity-40" : ""}`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? "border-white bg-white" : "border-zinc-600"}`}>
                        {done && (
                          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm flex-1 ${done ? "line-through text-zinc-600" : "text-zinc-200"}`}>
                        {item.name}
                      </span>
                      <span className="text-xs text-zinc-500 shrink-0">{item.amount}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8 gap-3">
          <span className="text-5xl">🛒</span>
          <p className="text-zinc-500 text-sm">no recipes selected yet</p>
          <Link href="/" className="text-sm text-white underline">plan your week first</Link>
        </div>
      )}
    </main>
  );
}
