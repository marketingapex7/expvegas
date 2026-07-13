"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { TripPick } from "@/types/directory";

const STORAGE_KEY = "experiencevegas.trip-picks.v1";

type TripSelectionContextValue = {
  items: TripPick[];
  hydrated: boolean;
  hasItem: (id: string) => boolean;
  toggleItem: (item: TripPick) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
};

const TripSelectionContext = createContext<TripSelectionContextValue | null>(null);

function readStoredItems() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as TripPick[]) : [];
  } catch {
    return [];
  }
}

export function TripSelectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TripPick[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      setItems(readStoredItems());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  useEffect(() => {
    function syncFromAnotherTab(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setItems(readStoredItems());
    }
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, []);

  const value = useMemo<TripSelectionContextValue>(() => ({
    items,
    hydrated,
    hasItem: (id) => items.some((item) => item.id === id),
    toggleItem: (item) => setItems((current) => current.some((entry) => entry.id === item.id)
      ? current.filter((entry) => entry.id !== item.id)
      : [...current, item]),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clearItems: () => setItems([]),
  }), [hydrated, items]);

  return <TripSelectionContext.Provider value={value}>{children}</TripSelectionContext.Provider>;
}

export function useTripSelections() {
  const context = useContext(TripSelectionContext);
  if (!context) throw new Error("useTripSelections must be used inside TripSelectionProvider");
  return context;
}
