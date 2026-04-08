import { CardGradients, Colors } from '@/constants/Colors';
import { CountdownEvent, useEvents } from '@/contexts/EventsContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeRemaining(targetDate: string): TimeRemaining {
  const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function CountdownCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CountdownEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [time, setTime] = useState<TimeRemaining>(() =>
    getTimeRemaining(event.targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(event.targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [event.targetDate]);

  const gradientColors = CardGradients[event.color] ?? [event.color, event.color];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Sparkles decoration */}
      <Text style={[styles.sparkle, styles.sparkleTopLeft]}>✨</Text>
      <Text style={[styles.sparkle, styles.sparkleBottomRight]}>✨</Text>

      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.name}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={8}>
            <Ionicons name="pencil-outline" size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      </View>

      {event.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {event.description}
        </Text>
      ) : null}

      <View style={styles.timerRow}>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{pad(time.days)}</Text>
          <Text style={styles.timeLabel}>days</Text>
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{pad(time.hours)}</Text>
          <Text style={styles.timeLabel}>hrs</Text>
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{pad(time.minutes)}</Text>
          <Text style={styles.timeLabel}>min</Text>
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{pad(time.seconds)}</Text>
          <Text style={styles.timeLabel}>sec</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export default function CountdownScreen() {
  const { events, deleteEvent } = useEvents();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = events
    .filter((e) => new Date(e.targetDate).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    );

  const handleEdit = useCallback((event: CountdownEvent) => {
    router.push({ pathname: '/(tabs)/add', params: { id: event.id } });
  }, []);

  const handleDelete = useCallback(
    (event: CountdownEvent) => {
      Alert.alert(
        'Delete Event',
        `Are you sure you want to delete "${event.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteEvent(event.id),
          },
        ]
      );
    },
    [deleteEvent]
  );

  return (
    <LinearGradient
      colors={['#FFF7FB', '#F5F0FF']}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>✨ Countdowns</Text>
        <Text style={styles.headerSubtitle}>
          {upcoming.length === 0
            ? 'There are no upcoming events currently'
            : `${upcoming.length} upcoming event${upcoming.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center' }]}
        showsVerticalScrollIndicator={false}
      >
        {upcoming.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌸</Text>
            <Text style={styles.emptyTitle}>Nothing yet!</Text>
            <Text style={styles.emptyText}>
              Tap &quot;Add Event&quot; to create a countdown
            </Text>
          </View>
        ) : (
          upcoming.map((event) => (
            <CountdownCard
              key={event.id}
              event={event}
              onEdit={() => handleEdit(event)}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
    opacity: 0.5,
  },
  sparkleTopLeft: {
    top: 8,
    left: 12,
  },
  sparkleBottomRight: {
    bottom: 8,
    right: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginRight: 8,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    lineHeight: 18,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: (width - 40 - 80) / 4 - 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  timeSep: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
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
