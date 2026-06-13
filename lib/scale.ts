export interface Ingredient {
  amount: number;
  unit: string;
  name: string;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  time: string;
  difficulty: string;
  originalServings: number;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  emoji: string;
  url: string;
  meal: "lunch" | "dinner";
}

const TARGET = 2;

function fmt(n: number): string {
  if (n === 0) return "";
  // Round to nearest 0.25
  const rounded = Math.round(n * 4) / 4;
  if (rounded === Math.floor(rounded)) return String(rounded);
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  const fracStr = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : rounded.toFixed(1).replace(/\.0$/, "");
  return whole > 0 ? `${whole}${fracStr}` : fracStr;
}

export function scaleIngredient(ing: Ingredient, originalServings: number): string {
  if (ing.amount === 0) return ing.name; // "salt to taste" etc.
  const ratio = TARGET / (originalServings || TARGET);
  const scaled = ing.amount * ratio;
  const amtStr = fmt(scaled);
  const parts = [amtStr, ing.unit, ing.name].filter(Boolean);
  return parts.join(" ");
}

export function scaledIngredients(recipe: Recipe): string[] {
  return recipe.ingredients.map((ing) => scaleIngredient(ing, recipe.originalServings));
}
