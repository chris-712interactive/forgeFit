"use client";

import {
  createCategoryId,
  getCategoryById,
  loadSavedMealCategories,
  mealFromMacros,
  saveSavedMeal,
  saveSavedMealCategory,
  type SavedMeal,
  type SavedMealCategory,
} from "@/lib/nutrition/saved-meals";
import { useEffect, useId, useState } from "react";

export interface SaveMealDraft {
  id?: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  categoryId?: string;
  /** When true, macro fields are editable (create-from-scratch flow) */
  editableMacros?: boolean;
}

interface SaveMealSheetProps {
  open: boolean;
  draft: SaveMealDraft | null;
  onClose: () => void;
  onSaved?: (meal: SavedMeal) => void;
}

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-base text-forge-text outline-none focus:border-forge-ember";

export function SaveMealSheet({
  open,
  draft,
  onClose,
  onSaved,
}: SaveMealSheetProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [categoryId, setCategoryId] = useState("favorites");
  const [categories, setCategories] = useState<SavedMealCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !draft) return;
    setName(draft.name);
    setCalories(String(draft.calories || ""));
    setProteinG(String(draft.proteinG || ""));
    setCarbsG(String(draft.carbsG || ""));
    setFatG(String(draft.fatG || ""));
    setCategoryId(draft.categoryId ?? "favorites");
    setCategories(loadSavedMealCategories());
    setNewCategoryName("");
    setShowNewCategory(false);
    setError(null);
  }, [open, draft]);

  const editableMacros =
    draft?.editableMacros ??
    (draft?.calories === 0 &&
      draft?.proteinG === 0 &&
      draft?.carbsG === 0 &&
      draft?.fatG === 0);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !draft) return null;

  function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const existing = categories.find(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setCategoryId(existing.id);
      setShowNewCategory(false);
      setNewCategoryName("");
      return;
    }

    const category: SavedMealCategory = {
      id: createCategoryId(trimmed),
      name: trimmed,
    };
    saveSavedMealCategory(category);
    setCategories(loadSavedMealCategories());
    setCategoryId(category.id);
    setShowNewCategory(false);
    setNewCategoryName("");
  }

  async function handleSave() {
    if (!draft) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give your meal a name.");
      return;
    }

    const caloriesNum = calories === "" ? 0 : Number(calories);
    const proteinNum = proteinG === "" ? 0 : Number(proteinG);
    const carbsNum = carbsG === "" ? 0 : Number(carbsG);
    const fatNum = fatG === "" ? 0 : Number(fatG);

    if (
      !Number.isFinite(caloriesNum) ||
      !Number.isFinite(proteinNum) ||
      !Number.isFinite(carbsNum) ||
      !Number.isFinite(fatNum) ||
      caloriesNum < 0 ||
      proteinNum < 0 ||
      carbsNum < 0 ||
      fatNum < 0
    ) {
      setError("Enter valid macro numbers.");
      return;
    }
    if (caloriesNum === 0 && proteinNum === 0 && carbsNum === 0 && fatNum === 0) {
      setError("Add at least one macro value.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const meal = saveSavedMeal({
        ...mealFromMacros({
          name: trimmedName,
          calories: caloriesNum,
          proteinG: proteinNum,
          carbsG: carbsNum,
          fatG: fatNum,
          categoryId,
          lineItems: [],
        }),
        id: draft.id,
      });
      onSaved?.(meal);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save meal.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = getCategoryById(categoryId, categories);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-end sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[var(--border)] bg-forge-surface-raised shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-forge-muted/40" aria-hidden />
        </div>

        <div className="overflow-y-auto px-5 pb-6 pt-4">
          <h2
            id={titleId}
            className="font-display text-xl font-bold text-forge-text"
          >
            {draft.id ? "Edit saved meal" : "Save to My Meals"}
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            Organize meals into categories for one-tap logging later.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {editableMacros ? (
              <div className="grid w-full grid-cols-2 gap-2.5">
                <MacroField label="Cal" value={calories} onChange={setCalories} color="text-forge-ember" />
                <MacroField label="Protein (g)" value={proteinG} onChange={setProteinG} color="text-forge-coral" />
                <MacroField label="Carbs (g)" value={carbsG} onChange={setCarbsG} color="text-forge-gold" />
                <MacroField label="Fat (g)" value={fatG} onChange={setFatG} color="text-forge-steel" />
              </div>
            ) : (
              <>
                <MacroPill label="Cal" value={Math.round(Number(calories) || draft.calories)} color="bg-forge-ember/15 text-forge-ember" />
                <MacroPill label="P" value={`${proteinG || draft.proteinG}g`} color="bg-forge-coral/15 text-forge-coral" />
                <MacroPill label="C" value={`${carbsG || draft.carbsG}g`} color="bg-forge-gold/15 text-forge-gold" />
                <MacroPill label="F" value={`${fatG || draft.fatG}g`} color="bg-forge-steel/15 text-forge-steel" />
              </>
            )}
          </div>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Meal name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Post-workout shake"
              className={inputClass}
              autoFocus
            />
          </label>

          <div className="mt-5">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    categoryId === category.id
                      ? "bg-forge-ember text-white"
                      : "border border-[var(--border)] bg-forge-surface text-forge-text hover:border-forge-ember/40"
                  }`}
                >
                  {category.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewCategory((open) => !open)}
                className="rounded-full border border-dashed border-[var(--border)] px-3.5 py-2 text-sm font-medium text-forge-steel transition-colors hover:border-forge-ember/40 hover:text-forge-ember"
              >
                + New
              </button>
            </div>

            {showNewCategory && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className={inputClass}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="shrink-0 rounded-xl bg-forge-surface px-4 text-sm font-semibold text-forge-ember"
                >
                  Add
                </button>
              </div>
            )}

            {selectedCategory && (
              <p className="mt-2 text-xs text-forge-muted">
                Saving to <span className="text-forge-text">{selectedCategory.name}</span>
              </p>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : draft.id ? "Update meal" : "Save meal"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] text-sm font-medium text-forge-muted hover:text-forge-text"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${color}`}>
      <span className="text-xs font-medium opacity-80">{label}</span>
      {value}
    </span>
  );
}

function MacroField({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: string;
}) {
  return (
    <label className="block">
      <span className={`mb-1 block text-xs font-semibold ${color}`}>{label}</span>
      <input
        type="number"
        min={0}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={inputClass}
      />
    </label>
  );
}
