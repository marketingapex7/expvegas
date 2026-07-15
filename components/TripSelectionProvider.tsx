"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { TripDates, TripPick, TripSettings } from "@/types/directory";

const STORAGE_KEY = "experiencevegas.trip-picks.v1";
const DATES_STORAGE_KEY = "experiencevegas.trip-dates.v1";
const SETTINGS_STORAGE_KEY = "experiencevegas.trip-settings.v1";

type TripSelectionContextValue = {
  items: TripPick[];
  dates: TripDates;
  settings: TripSettings;
  hydrated: boolean;
  hasItem: (id: string) => boolean;
  toggleItem: (item: TripPick) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  setDates: (dates: TripDates) => void;
  setSettings: (settings: TripSettings) => void;
  updateItem: (id: string, updates: Partial<Pick<TripPick, "status" | "locked">>) => void;
  reorderItem: (sourceId: string, targetId: string) => void;
  moveItem: (id: string, direction: -1 | 1) => void;
  importTrip: (items: TripPick[], dates: TripDates, settings?: TripSettings) => void;
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

function readStoredDates(): TripDates {
  try {
    const value = window.localStorage.getItem(DATES_STORAGE_KEY);
    return value ? (JSON.parse(value) as TripDates) : { arrivalDate: "", departureDate: "" };
  } catch {
    return { arrivalDate: "", departureDate: "" };
  }
}

function readStoredSettings(): TripSettings {
  try {
    const value = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return value ? (JSON.parse(value) as TripSettings) : { partySize: 2, budgetCap: 0 };
  } catch {
    return { partySize: 2, budgetCap: 0 };
  }
}

function normalizeItem(item: TripPick): TripPick {
  return { ...item, status: item.status || "considering", locked: Boolean(item.locked) };
}

export function TripSelectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TripPick[]>([]);
  const [dates, setDates] = useState<TripDates>({ arrivalDate: "", departureDate: "" });
  const [settings, setSettings] = useState<TripSettings>({ partySize: 2, budgetCap: 0 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      setItems(readStoredItems().map(normalizeItem));
      setDates(readStoredDates());
      setSettings(readStoredSettings());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(dates));
  }, [dates, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  useEffect(() => {
    function syncFromAnotherTab(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setItems(readStoredItems());
      if (event.key === DATES_STORAGE_KEY) setDates(readStoredDates());
      if (event.key === SETTINGS_STORAGE_KEY) setSettings(readStoredSettings());
    }
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, []);

  const value = useMemo<TripSelectionContextValue>(() => ({
    items,
    dates,
    settings,
    hydrated,
    hasItem: (id) => items.some((item) => item.id === id),
    toggleItem: (item) => setItems((current) => current.some((entry) => entry.id === item.id)
      ? current.filter((entry) => entry.id !== item.id)
      : [...current, normalizeItem(item)]),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clearItems: () => setItems([]),
    setDates,
    setSettings,
    updateItem: (id, updates) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item)),
    reorderItem: (sourceId, targetId) => setItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId);
      const targetIndex = current.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current;
      const next = [...current];
      const [source] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, source);
      return next;
    }),
    moveItem: (id, direction) => setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    }),
    importTrip: (nextItems, nextDates, nextSettings) => {
      setItems(nextItems.map(normalizeItem));
      setDates(nextDates);
      if (nextSettings) setSettings(nextSettings);
    },
  }), [dates, hydrated, items, settings]);

  return <TripSelectionContext.Provider value={value}>{children}</TripSelectionContext.Provider>;
}

export function useTripSelections() {
  const context = useContext(TripSelectionContext);
  if (!context) throw new Error("useTripSelections must be used inside TripSelectionProvider");
  return context;
}
