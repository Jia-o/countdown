import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

export interface CountdownEvent {
  id: string;
  name: string;
  description: string;
  targetDate: string; // ISO datetime
  createdAt: string; // ISO datetime
  color: string; // accent color assigned at creation
}

interface EventsContextType {
  events: CountdownEvent[];
  addEvent: (
    data: Omit<CountdownEvent, 'id' | 'createdAt' | 'color'>
  ) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Omit<CountdownEvent, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  loading: boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

const STORAGE_KEY = '@countdown_events';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function getRandomAccentColor(): string {
  const colors = Colors.accentColors;
  return colors[Math.floor(Math.random() * colors.length)];
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: CountdownEvent[] = JSON.parse(raw);
          setEvents(parsed);
        }
      } catch (err) {
        console.error('Failed to load events from storage:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistEvents = useCallback(async (newEvents: CountdownEvent[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
    } catch (err) {
      console.error('Failed to persist events:', err);
    }
  }, []);

  const addEvent = useCallback(
    async (data: Omit<CountdownEvent, 'id' | 'createdAt' | 'color'>) => {
      const newEvent: CountdownEvent = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        color: getRandomAccentColor(),
      };
      const updated = [...eventsRef.current, newEvent];
      setEvents(updated);
      await persistEvents(updated);
    },
    [persistEvents]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Omit<CountdownEvent, 'id' | 'createdAt'>>) => {
      const updated = eventsRef.current.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      setEvents(updated);
      await persistEvents(updated);
    },
    [persistEvents]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const updated = eventsRef.current.filter((e) => e.id !== id);
      setEvents(updated);
      await persistEvents(updated);
    },
    [persistEvents]
  );

  return (
    <EventsContext.Provider
      value={{ events, addEvent, updateEvent, deleteEvent, loading }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within an EventsProvider');
  return ctx;
}
