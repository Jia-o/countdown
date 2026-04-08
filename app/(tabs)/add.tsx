import { Colors } from '@/constants/Colors';
import { useEvents } from '@/contexts/EventsContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AddScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { events, addEvent, updateEvent } = useEvents();

  const editingEvent = id ? events.find((e) => e.id === id) : undefined;
  const isEditing = !!editingEvent;

  const [name, setName] = useState(editingEvent?.name ?? '');
  const [description, setDescription] = useState(
    editingEvent?.description ?? ''
  );
  const [targetDate, setTargetDate] = useState<Date>(() => {
    if (editingEvent) return new Date(editingEvent.targetDate);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when params change (e.g. navigating back then to add screen fresh)
  useEffect(() => {
    if (!isEditing) {
      setName('');
      setDescription('');
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setMinutes(0, 0, 0);
      setTargetDate(d);
    }
  }, [isEditing, id]);

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) {
      setTargetDate((prev) => {
        const next = new Date(selected);
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  const handleTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) {
      setTargetDate((prev) => {
        const next = new Date(prev);
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a name for this event.');
      return;
    }

    const isPastDate = targetDate.getTime() <= Date.now();

    if (isPastDate && !isEditing) {
      Alert.alert(
        'Date in the past',
        'This event date has already passed. It will be added directly to Past Events. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: async () => { await saveEvent(trimmedName, true); } },
        ]
      );
      return;
    }

    if (isPastDate && isEditing) {
      Alert.alert(
        'Date is in the past',
        'This event will be moved to Past Events. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: async () => { await saveEvent(trimmedName, true); } },
        ]
      );
      return;
    }

    await saveEvent(trimmedName, false);
  };

  const saveEvent = async (trimmedName: string, isPast: boolean) => {

    setSubmitting(true);
    try {
      if (isEditing && editingEvent) {
        await updateEvent(editingEvent.id, {
          name: trimmedName,
          description: description.trim(),
          targetDate: targetDate.toISOString(),
        });
      } else {
        await addEvent({
          name: trimmedName,
          description: description.trim(),
          targetDate: targetDate.toISOString(),
        });
      }
      // Navigate to past events if the date is in the past, otherwise home
      router.navigate(isPast ? '/(tabs)/past' : '/(tabs)');
    } catch (error) {
      // ADD THIS LOG
      console.error("Save Error Details:", error);
      Alert.alert('Error', `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <LinearGradient colors={['#FFF7FB', '#F5F0FF']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              {isEditing ? '✏️ Edit Event' : '✨ New Event'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditing
                ? 'Update your countdown details'
                : 'Create a countdown to something special'}
            </Text>
          </View>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="star-outline"
                size={18}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. My Birthday 🎂"
                placeholderTextColor={Colors.textSecondary}
                maxLength={60}
              />
            </View>
          </View>

          {/* Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                setShowTimePicker(false);
                setShowDatePicker((v) => !v);
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <Text style={styles.pickerButtonText}>{formatDate(targetDate)}</Text>
              <Ionicons
                name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            {showDatePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={targetDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  textColor={Colors.textPrimary}
                />
              </View>
            )}
          </View>

          {/* Time */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Time *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker((v) => !v);
              }}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <Text style={styles.pickerButtonText}>{formatTime(targetDate)}</Text>
              <Ionicons
                name={showTimePicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            {showTimePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={targetDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  textColor={Colors.textPrimary}
                />
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a note about this event…"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Ionicons
                name={isEditing ? 'checkmark-circle-outline' : 'add-circle-outline'}
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitText}>
                {submitting
                  ? 'Saving…'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Countdown'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.navigate('/(tabs)')}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  headerContainer: {
    paddingTop: 64,
    paddingBottom: 24,
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
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    paddingHorizontal: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12,
  },
  textArea: {
    height: 80,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    paddingHorizontal: 14,
    height: 52,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
  },
  submitBtn: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
