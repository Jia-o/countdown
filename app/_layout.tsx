import { Stack } from 'expo-router';
import { EventsProvider } from '@/contexts/EventsContext';

export default function RootLayout() {
  return (
    <EventsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </EventsProvider>
  );
}
