// ============================================================================
// SimpleDatePicker - Pure JS date picker for Expo Go compatibility
// Replaces @react-native-community/datetimepicker
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

interface SimpleDatePickerProps {
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (event: { type: string }, selectedDate?: Date) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function SimpleDatePicker({
  value,
  minimumDate,
  maximumDate,
  onChange,
}: SimpleDatePickerProps) {
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedDay, setSelectedDay] = useState(value.getDate());

  const minDate = minimumDate || new Date(2020, 0, 1);
  const maxDate = maximumDate || new Date(2030, 11, 31);

  // Generate years
  const years: number[] = [];
  for (let y = minDate.getFullYear(); y <= maxDate.getFullYear(); y++) {
    years.push(y);
  }

  // Days in selected month/year
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  // Clamp day if month changed
  const clampedDay = Math.min(selectedDay, daysInMonth);

  const isDateValid = (y: number, m: number, d: number) => {
    const date = new Date(y, m, d);
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return false;
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return false;
    return true;
  };

  const handleConfirm = () => {
    const finalDay = Math.min(clampedDay, daysInMonth);
    const newDate = new Date(selectedYear, selectedMonth, finalDay);
    onChange({ type: 'set' }, newDate);
  };

  const handleCancel = () => {
    onChange({ type: 'dismissed' });
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={handleCancel}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <TouchableOpacity activeOpacity={1} style={styles.container}>
          <Text style={styles.title}>Select Date</Text>

          <View style={styles.pickerRow}>
            {/* Day */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Day</Text>
              <FlatList
                data={days}
                keyExtractor={(item) => `d-${item}`}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item === clampedDay;
                  const valid = isDateValid(selectedYear, selectedMonth, item);
                  return (
                    <TouchableOpacity
                      onPress={() => valid && setSelectedDay(item)}
                      style={[
                        styles.item,
                        isSelected && styles.itemSelected,
                        !valid && styles.itemDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          isSelected && styles.itemTextSelected,
                          !valid && styles.itemTextDisabled,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                initialScrollIndex={Math.max(0, clampedDay - 3)}
                getItemLayout={(_, index) => ({
                  length: 44,
                  offset: 44 * index,
                  index,
                })}
              />
            </View>

            {/* Month */}
            <View style={[styles.column, { flex: 1.5 }]}>
              <Text style={styles.columnLabel}>Month</Text>
              <FlatList
                data={MONTHS}
                keyExtractor={(item) => item}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                  const isSelected = index === selectedMonth;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedMonth(index)}
                      style={[
                        styles.item,
                        isSelected && styles.itemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          isSelected && styles.itemTextSelected,
                        ]}
                      >
                        {item.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                initialScrollIndex={Math.max(0, selectedMonth - 2)}
                getItemLayout={(_, index) => ({
                  length: 44,
                  offset: 44 * index,
                  index,
                })}
              />
            </View>

            {/* Year */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Year</Text>
              <FlatList
                data={years}
                keyExtractor={(item) => `y-${item}`}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item === selectedYear;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedYear(item)}
                      style={[
                        styles.item,
                        isSelected && styles.itemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          isSelected && styles.itemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                initialScrollIndex={Math.max(0, years.indexOf(selectedYear) - 2)}
                getItemLayout={(_, index) => ({
                  length: 44,
                  offset: 44 * index,
                  index,
                })}
              />
            </View>
          </View>

          {/* Preview */}
          <Text style={styles.preview}>
            {new Date(selectedYear, selectedMonth, clampedDay).toLocaleDateString(
              undefined,
              { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  list: {
    height: 180,
  },
  item: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
  },
  itemSelected: {
    backgroundColor: Colors.primary[500],
  },
  itemDisabled: {
    opacity: 0.3,
  },
  itemText: {
    fontSize: Typography.size.base,
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  itemTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  itemTextDisabled: {
    color: Colors.neutral[300],
  },
  preview: {
    fontSize: Typography.size.sm,
    color: Colors.primary[600],
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.size.base,
    fontWeight: '600',
    color: Colors.neutral[600],
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
  confirmText: {
    fontSize: Typography.size.base,
    fontWeight: '700',
    color: '#fff',
  },
});
