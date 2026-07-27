"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { TypeBadge, TypeChip } from "@/components/TypeSymbol";
import { COPY } from "@/lib/copy";
import {
  ALL_POKEMON_TYPES,
  listLanguageTypeEntries,
  type LanguageTypeEntry,
} from "@/lib/docs-catalog";
import type { PokemonType } from "@/lib/types";

const ENTRIES = listLanguageTypeEntries();

export default function LanguageTypeTable() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PokemonType | null>(null);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return ENTRIES.filter((entry) => {
      if (typeFilter && entry.type !== typeFilter) return false;
      if (!q) return true;
      return entry.language.toLowerCase().includes(q);
    });
  }, [deferredQuery, typeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<PokemonType, LanguageTypeEntry[]>();
    for (const entry of filtered) {
      const list = map.get(entry.type) ?? [];
      list.push(entry);
      map.set(entry.type, list);
    }
    return ALL_POKEMON_TYPES.filter((t) => map.has(t)).map((type) => ({
      type,
      languages: map.get(type)!,
    }));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="dex-lang-search">
          {COPY.docs.languageSearch}
        </label>
        <input
          id="dex-lang-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={COPY.docs.languageSearch}
          className="gba-field w-full max-w-sm px-3 py-2 text-sm"
        />
        <p className="text-[11px] text-[var(--muted)]">
          {filtered.length} language{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter(null)}
          className={`border-2 px-2 py-1 font-display text-[0.45rem] uppercase tracking-wider ${
            typeFilter === null
              ? "border-[var(--ink)] bg-[var(--accent)] text-[var(--accent-contrast)]"
              : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--muted)]"
          }`}
        >
          {COPY.docs.languageAllTypes}
        </button>
        {ALL_POKEMON_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() =>
              setTypeFilter((current) => (current === type ? null : type))
            }
            className={`transition-opacity ${
              typeFilter !== null && typeFilter !== type ? "opacity-40" : ""
            }`}
            aria-pressed={typeFilter === type}
          >
            <TypeBadge type={type} />
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No languages match.</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ type, languages }) => (
            <div key={type}>
              <div className="mb-2 flex items-center gap-2">
                <TypeBadge type={type} />
                <span className="text-[11px] text-[var(--muted)]">
                  {languages.length}
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {languages.map((entry) => (
                  <li
                    key={entry.language}
                    className="dex-divider flex items-center gap-2 py-1.5 pr-2"
                  >
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 border border-[var(--border)]"
                      style={{ background: entry.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-[var(--foreground)]">
                      {entry.language}
                    </span>
                    <TypeChip type={entry.type} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
