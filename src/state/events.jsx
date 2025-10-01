// src/state/events.jsx
import { createContext, useContext, useMemo, useState, useEffect } from "react";

const KEY = "gbb_event_v1";
const EventsCtx = createContext(null);

export function EventsProvider({ children }) {
  const [currentEvent, setCurrentEvent] = useState(null);

  // load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.currentEvent?.id) setCurrentEvent(parsed.currentEvent);
      }
    } catch {}
  }, []);

  // persist whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ currentEvent }));
    } catch {}
  }, [currentEvent]);

  const isActive = !!currentEvent && !currentEvent.endedAt;

  const startEvent = ({ name, location = null }) => {
    const id = `${String(name || "Event")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 40)}-${Date.now()}`;
    const now = new Date().toISOString();
    setCurrentEvent({
      id,
      name: name?.trim() || "Event",
      location: location || null,
      startedAt: now,
      endedAt: null,
    });
  };

  const endEvent = () => {
    if (!currentEvent) return;
    setCurrentEvent({ ...currentEvent, endedAt: new Date().toISOString() });
  };

  // read-only helpers for consumers
  const getEventWindow = () => ({
    fromISO: currentEvent?.startedAt || null,
    toISO: currentEvent?.endedAt || null,
  });

  const value = useMemo(
    () => ({
      currentEvent,
      isActive,
      startEvent,
      endEvent,
      getEventWindow,
    }),
    [currentEvent, isActive]
  );

  return <EventsCtx.Provider value={value}>{children}</EventsCtx.Provider>;
}

export const useEvents = () => useContext(EventsCtx) || {
  currentEvent: null,
  isActive: false,
  startEvent: () => {},
  endEvent: () => {},
  getEventWindow: () => ({ fromISO: null, toISO: null }),
};
