"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  time: string;
  emoji: string;
  meal: "lunch" | "dinner";
  ingredients: string[];
  steps: string[];
  description: string;
  url: string;
}

interface DayPlan {
  day: string;
  lunch: Recipe | null;
  dinner: Recipe | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SchedulePage() {
  const [week, setWeek] = useState<DayPlan[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("selectedRecipes");
    if (!saved) return;
    const recipes: Recipe[] = JSON.parse(saved);

    const lunches = recipes.filter((r) => r.meal === "lunch");
    const dinners = recipes.filter((r) => r.meal === "dinner");

    const plan: DayPlan[] = DAYS.map((day, i) => ({
      day,
      lunch: lunches[i] ?? null,
      dinner: dinners[i] ?? null,
    }));

    setWeek(plan);
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white pb-12">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">this week</h1>
          <p className="text-zinc-400 text-sm mt-1">your meal plan</p>
        </div>
        <Link href="/" className="text-xs text-zinc-500 underline">edit meals</Link>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {week.map(({ day, lunch, dinner }) => {
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`rounded-2xl border ${isToday ? "border-white" : "border-zinc-800"} bg-zinc-950 overflow-hidden`}
            >
              <div className={`px-4 py-3 flex items-center gap-2 ${isToday ? "bg-white" : "bg-zinc-900"}`}>
                <span className={`text-sm font-bold ${isToday ? "text-black" : "text-white"}`}>{day}</span>
                {isToday && <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">today</span>}
              </div>

              <div className="divide-y divide-zinc-800">
                <MealRow label="Lunch" recipe={lunch} />
                <MealRow label="Dinner" recipe={dinner} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 mt-6">
        <Link
          href="/groceries"
          className="block w-full py-4 rounded-2xl bg-white text-black font-semibold text-base text-center active:scale-95 transition-transform"
        >
          view grocery list →
        </Link>
      </div>
    </main>
  );
}

function MealRow({ label, recipe }: { label: string; recipe: Recipe | null }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-xs text-zinc-500 w-12 shrink-0">{label}</span>
      {recipe ? (
        <Link href={`/cook/${recipe.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xl">{recipe.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{recipe.name}</p>
            <p className="text-xs text-zinc-500">{recipe.time} · {recipe.cuisine}</p>
          </div>
          <span className="ml-auto text-zinc-600 text-sm">›</span>
        </Link>
      ) : (
        <span className="text-sm text-zinc-700">—</span>
      )}
    </div>
  );
}
