// ============================================================================
// Location Picker Modal
// Interactive Map to select a location (Rapido/Ola style)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentLocation, reverseGeocodeCoords, geocodeAddress } from '@/services/location';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import Button from './Button';

// Default center (e.g., somewhere in India as it's an Indian app context, or a generic fallback)
const DEFAULT_LATITUDE = 17.385044; // Hyderabad
const DEFAULT_LONGITUDE = 78.486671;
const DEFAULT_LATITUDE_DELTA = 0.05;
const DEFAULT_LONGITUDE_DELTA = 0.05;

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: LocationData) => void;
  initialLocation?: { latitude: number; longitude: number };
}

export default function LocationPicker({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}: LocationPickerProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || DEFAULT_LATITUDE,
    longitude: initialLocation?.longitude || DEFAULT_LONGITUDE,
    latitudeDelta: DEFAULT_LATITUDE_DELTA,
    longitudeDelta: DEFAULT_LONGITUDE_DELTA,
  });

  const [currentAddress, setCurrentAddress] = useState<string>('Loading address...');
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // When modal opens, center on initial or current location
  useEffect(() => {
    if (visible) {
      if (initialLocation) {
        setRegion({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: DEFAULT_LATITUDE_DELTA,
          longitudeDelta: DEFAULT_LONGITUDE_DELTA,
        });
        updateAddress(initialLocation.latitude, initialLocation.longitude);
      } else {
        handleLocateMe();
      }
    }
  }, [visible, initialLocation]);

  const updateAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    const address = await reverseGeocodeCoords(lat, lng);
    setCurrentAddress(address || 'Unknown Location');
    setIsLoadingAddress(false);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setIsMapMoving(false);
    setRegion(newRegion);
    updateAddress(newRegion.latitude, newRegion.longitude);
  };

  const handleLocateMe = async () => {
    setIsLoadingAddress(true);
    const coords = await getCurrentLocation();
    if (coords) {
      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      updateAddress(coords.latitude, coords.longitude);
    } else {
      setIsLoadingAddress(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    
    const coords = await geocodeAddress(searchQuery);
    if (coords) {
      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else {
      import('react-native').then(({ Alert }) => {
        Alert.alert('Search Failed', 'Could not find the location. Try a different search term.');
      });
    }
    
    setIsSearching(false);
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: region.latitude,
      longitude: region.longitude,
      address: currentAddress,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChange={() => setIsMapMoving(true)}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
        />

        {/* Center Pin Overlay */}
        <View style={styles.centerPinContainer} pointerEvents="none">
          <View style={[styles.centerPin, isMapMoving && styles.centerPinMoving]}>
            <Ionicons name="location-sharp" size={48} color="#EF4444" />
          </View>
          {/* Shadow under the pin */}
          {!isMapMoving && <View style={styles.pinShadow} />}
        </View>

        {/* Top Bar (Search & Close) */}
        <View style={[styles.topBar, { paddingTop: insets.top || Spacing.md }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={Colors.neutral[800]} />
          </TouchableOpacity>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.neutral[500]} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholderTextColor={Colors.neutral[400]}
            />
            {isSearching && <ActivityIndicator size="small" color={Colors.primary[500]} style={{ marginRight: 8 }} />}
          </View>
        </View>

        {/* Locate Me Button */}
        <TouchableOpacity style={styles.locateBtn} onPress={handleLocateMe}>
          <Ionicons name="locate" size={24} color={Colors.primary[600]} />
        </TouchableOpacity>

        {/* Bottom Info Sheet */}
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom || Spacing.lg }]}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={20} color={Colors.neutral[400]} />
            <Text style={styles.addressLabel}>Select Location</Text>
          </View>
          
          <View style={styles.addressContent}>
            {isLoadingAddress ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {currentAddress}
              </Text>
            )}
          </View>

          <Button
            title="Confirm Location"
            onPress={handleConfirm}
            disabled={isLoadingAddress || isMapMoving}
            size="lg"
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  map: {
    flex: 1,
  },
  
  // Center Pin
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24, // half of icon size (48)
    marginTop: -48,  // full icon size to make tip point at center
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  centerPin: {
    transform: [{ translateY: 0 }],
  },
  centerPinMoving: {
    transform: [{ translateY: -15 }],
  },
  pinShadow: {
    width: 12,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6,
    position: 'absolute',
    top: '50%',
    marginTop: -2,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...Shadows.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: 20,
    ...Shadows.sm,
    marginRight: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.neutral[800],
    height: '100%',
  },

  // Locate Me
  locateBtn: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 200, // Above the bottom sheet
    width: 50,
    height: 50,
    backgroundColor: Colors.neutral[0],
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addressLabel: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.neutral[500],
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
  },
  addressContent: {
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  addressText: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.neutral[800],
  },
  confirmBtn: {
    width: '100%',
  },
});
