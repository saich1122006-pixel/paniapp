// ============================================================================
// Edit Job Screen
// Form to update an existing daily-wage job listing
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { updateJob, getJob } from '@/services/jobs';
import { getCurrentLocation, reverseGeocodeCoords, geocodeAddress } from '@/services/location';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LocationPicker from '@/components/ui/LocationPicker';
import { Colors, Spacing, Typography, BorderRadius, Shadows, APP_CONFIG } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function EditJobScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const params = useLocalSearchParams();
  const jobId = params.id as string;

  const [initialLoading, setInitialLoading] = useState(true);
  const [workName, setWorkName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState('');

  useEffect(() => {
    if (!jobId) {
      Alert.alert('Error', 'No job ID provided');
      router.back();
      return;
    }

    const loadJobDetails = async () => {
      const { data, error } = await getJob(jobId);
      if (error || !data) {
        Alert.alert('Error', 'Failed to load job details');
        router.back();
        return;
      }

      setWorkName(data.work_name);
      setPaymentAmount(data.payment_amount.toString());
      if (data.estimated_hours) setEstimatedHours(data.estimated_hours.toString());
      if (data.location_address) {
        setCurrentAddress(data.location_address);
        setManualAddress(data.location_address);
      }
      
      // Parse job location if available (assuming it returns as a WKB or object, we might need a separate call or just use empty if not decoded. Wait, getJob returns the job_location, but ST_AsText is not called in getJob unless we changed it. Actually let's assume it doesn't decode it easily, we'll just not pre-fill location map unless we have lat/lng directly. For simplicity, we can let them re-select or keep existing if not selected.)
      // Wait, in Supabase without ST_AsGeoJSON it might just be binary. If they don't select a new one, we just don't pass lat/lng to updateJob.
      
      setInitialLoading(false);
    };

    loadJobDetails();
  }, [jobId]);

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    const coords = await getCurrentLocation();
    if (coords) {
      const address = await reverseGeocodeCoords(coords.latitude, coords.longitude);
      setSelectedLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address || 'Current Location',
      });
      setManualAddress(address || 'Current Location');
    } else {
      Alert.alert('Error', 'Could not get your location. Please check permissions.');
    }
    setIsGettingLocation(false);
  };

  const handlePost = async () => {
    if (!workName.trim()) {
      Alert.alert('Required', 'Please enter a job name');
      return;
    }
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Required', 'Please enter a valid payment amount');
      return;
    }
    if (!estimatedHours || parseFloat(estimatedHours) <= 0) {
      Alert.alert('Required', 'Please enter estimated hours');
      return;
    }

    setLoading(true);

    let latitude, longitude, locationAddress;
    
    if (manualAddress.trim() && manualAddress.trim() !== (selectedLocation?.address || currentAddress)) {
      const coords = await geocodeAddress(manualAddress.trim());
      if (!coords) {
        Alert.alert('Location Error', 'Could not find coordinates for this address. Please try a more specific address or use the map.');
        setLoading(false);
        return;
      }
      latitude = coords.latitude;
      longitude = coords.longitude;
      locationAddress = manualAddress.trim();
    } else if (selectedLocation) {
      latitude = selectedLocation.latitude;
      longitude = selectedLocation.longitude;
      locationAddress = selectedLocation.address;
    }

    const result = await updateJob(jobId, {
      workName: workName.trim(),
      paymentAmount: parseFloat(paymentAmount),
      estimatedHours: parseFloat(estimatedHours),
      latitude,
      longitude,
      locationAddress,
    });

    setLoading(false);

    if (!result.error) {
      Alert.alert('Success! 🎉', 'Your job has been updated', [
        { text: 'OK', onPress: () => router.push('/(recruiter)/home' as any) },
      ]);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('recruiter_edit_job.title', 'Edit Job')}</Text>
          <Text style={styles.subtitle}>
            {t('recruiter_edit_job.description_placeholder', 'Update the details of your job')}
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.formCard}>
          <Input
            label={t('recruiter_post_job.job_title', 'Job Title')}
            placeholder={t('recruiter_post_job.job_title_placeholder', 'e.g., Construction Helper')}
            value={workName}
            onChangeText={setWorkName}
            size="lg"
          />

          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input
                label={`Amount (${APP_CONFIG.CURRENCY_SYMBOL})`}
                placeholder="e.g., 600"
                value={paymentAmount}
                onChangeText={(text) => setPaymentAmount(text.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                size="lg"
                hint="Total pay"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Hours"
                placeholder="e.g., 4"
                value={estimatedHours}
                onChangeText={(text) => setEstimatedHours(text.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                size="lg"
                hint="Est. duration"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationHeaderRow}>
            <Text style={styles.sectionLabel}>Job Location</Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md }}>
            <Button
              title="📍 Current Location"
              onPress={handleUseCurrentLocation}
              loading={isGettingLocation}
              variant="outline"
              style={{ flex: 1 }}
              size="sm"
            />
            <Button
              title="🗺️ Place of Work"
              onPress={() => setIsPickerVisible(true)}
              variant="outline"
              style={{ flex: 1 }}
              size="sm"
            />
          </View>

          {(selectedLocation || currentAddress) && (
            <View style={styles.locationSection}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationHint} numberOfLines={2}>
                  {selectedLocation ? selectedLocation.address : currentAddress}
                </Text>
              </View>
            </View>
          )}

          <View style={{ marginTop: Spacing.sm }}>
            <Input
              label="Or enter address manually"
              placeholder="e.g., 123 Main St, City"
              value={manualAddress}
              onChangeText={setManualAddress}
              size="md"
            />
          </View>
        </Card>

        {/* Preview */}
        {workName.trim() && paymentAmount && estimatedHours && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Preview</Text>
            <Card style={styles.previewCard}>
              <Text style={styles.previewJobName}>{workName}</Text>
              <Text style={styles.previewWage}>
                {APP_CONFIG.CURRENCY_SYMBOL}{paymentAmount}
                <Text style={styles.previewWageUnit}> for {estimatedHours} hrs</Text>
              </Text>
              <Text style={styles.previewRecruiter}>
                Posted by {profile?.full_name || 'You'}
              </Text>
            </Card>
          </View>
        )}

        <Button
          title={`💾 ${t('recruiter_edit_job.save_btn', 'Save Changes')}`}
          onPress={handlePost}
          loading={loading}
          disabled={!workName.trim() || !paymentAmount || !estimatedHours}
          size="lg"
          variant="primary"
        />
      </ScrollView>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onConfirm={(location) => {
          setSelectedLocation(location);
          setManualAddress(location.address);
          setIsPickerVisible(false);
        }}
        initialLocation={selectedLocation || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: {
    padding: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing['5xl'],
  },
  header: { marginBottom: Spacing['2xl'] },
  title: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.light.textPrimary },
  subtitle: { fontSize: Typography.size.base, color: Colors.neutral[500], marginTop: Spacing.xs },

  formCard: { padding: Spacing['2xl'], marginBottom: Spacing['2xl'] },

  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: Colors.neutral[700],
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
  },
  useCurrentText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  locationSection: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.neutral[50], borderRadius: BorderRadius.lg,
    padding: Spacing.lg, gap: Spacing.md,
  },
  locationIcon: { fontSize: 24 },
  locationInfo: { flex: 1 },
  locationHint: { fontSize: Typography.size.sm, color: Colors.neutral[700], fontWeight: '500' },

  previewSection: { marginBottom: Spacing['2xl'] },
  previewTitle: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.neutral[500], textTransform: 'uppercase', letterSpacing: Typography.letterSpacing.wider, marginBottom: Spacing.sm },
  previewCard: {
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent[500],
  },
  previewJobName: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.light.textPrimary },
  previewWage: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.accent[700], marginTop: Spacing.xs },
  previewWageUnit: { fontSize: Typography.size.sm, fontWeight: '500', color: Colors.neutral[500] },
  previewRecruiter: { fontSize: Typography.size.sm, color: Colors.neutral[500], marginTop: Spacing.sm },
});
