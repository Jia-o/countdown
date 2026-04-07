import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, CountdownEvent } from '@/contexts/EventsContext';
import { Colors } from '@/constants/Colors';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

function getTimeSince(targetDate: string): string {
  const now = new Date();
  const past = new Date(targetDate);
  const diff = Math.max(0, now.getTime() - past.getTime());
  const totalSeconds = Math.floor(diff / 1000);

  if (totalSeconds < SECONDS_PER_MINUTE) return 'just now';
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  if (minutes < SECONDS_PER_MINUTE) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  // Use calendar-aware month difference
  const months =
    (now.getFullYear() - past.getFullYear()) * 12 +
    (now.getMonth() - past.getMonth());
  if (months < 1) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = now.getFullYear() - past.getFullYear();
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

function PastEventCard({
  event,
  timeSince,
  onDelete,
}: {
  event: CountdownEvent;
  timeSince: string;
  onDelete: () => void;
}) {
  const targetDate = new Date(event.targetDate);
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: Colors.pastEvents }]} />

      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {event.name}
          </Text>
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {event.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.timeSinceBadge}>
            <Ionicons name="time-outline" size={13} color={Colors.pastEvents} />
            <Text style={styles.timeSinceText}>{timeSince}</Text>
          </View>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      </View>

      {/* Sparkle */}
      <Text style={styles.sparkle}>🌸</Text>
    </View>
  );
}

export default function PastEventsScreen() {
  const { events, deleteEvent } = useEvents();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const pastEvents = events
    .filter((e) => new Date(e.targetDate).getTime() <= now)
    .sort(
      (a, b) =>
        new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime()
    );

  const handleDelete = useCallback(
    (event: CountdownEvent) => {
      Alert.alert(
        'Remove Event',
        `Remove "${event.name}" from past events?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => deleteEvent(event.id),
          },
        ]
      );
    },
    [deleteEvent]
  );

  return (
    <LinearGradient colors={['#FFF7FB', '#FFF0F0']} style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>🌸 Past Events</Text>
        <Text style={styles.headerSubtitle}>
          {pastEvents.length === 0
            ? 'No past events yet'
            : `${pastEvents.length} past event${pastEvents.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pastEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🕰️</Text>
            <Text style={styles.emptyTitle}>Nothing here yet!</Text>
            <Text style={styles.emptyText}>
              Expired countdowns will appear here automatically
            </Text>
          </View>
        ) : (
          pastEvents.map((event) => (
            <PastEventCard
              key={event.id}
              event={event}
              timeSince={getTimeSince(event.targetDate)}
              onDelete={() => handleDelete(event)}
            />
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    shadowColor: Colors.pastEvents,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  accentBar: {
    width: 5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardInner: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeSinceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  timeSinceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.pastEvents,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sparkle: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontSize: 16,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
