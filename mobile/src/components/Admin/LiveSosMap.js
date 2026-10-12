import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

let MapView = null;
let Marker = null;
let Polyline = null;
let Circle = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  Circle = Maps.Circle;
} catch (e) {
  console.log('[LiveSosMap] react-native-maps not available:', e);
}

export default function LiveSosMap({
  latitude,
  longitude,
  accuracy = 15,
  victimName = 'Victim Member',
  history = [],
  isEmergency = true,
  height = 260,
  style,
  onFullscreen,
}) {
  const mapRef = useRef(null);

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const isValid = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  useEffect(() => {
    if (isValid && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  }, [lat, lng, isValid]);

  const openGoogleMaps = () => {
    if (!isValid) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const coordinatesTrail = (history || [])
    .filter((pt) => pt && pt.latitude && pt.longitude)
    .map((pt) => ({
      latitude: parseFloat(pt.latitude),
      longitude: parseFloat(pt.longitude),
    }))
    .filter((pt) => !isNaN(pt.latitude) && !isNaN(pt.longitude));

  // Add current position to trail if not empty
  if (isValid && (!coordinatesTrail.length || coordinatesTrail[coordinatesTrail.length - 1].latitude !== lat)) {
    coordinatesTrail.push({ latitude: lat, longitude: lng });
  }

  if (!isValid) {
    return (
      <View style={[styles.placeholderContainer, { height }, style]}>
        <Ionicons name="location-outline" size={36} color={COLORS.primaryLight} />
        <Text style={styles.placeholderTitle}>Awaiting GPS Signal...</Text>
        <Text style={styles.placeholderSub}>Live coordinates will appear here once broadcasted.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }, style]}>
      {MapView ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          toolbarEnabled={false}
        >
          {/* Accuracy Circle */}
          {Circle && (
            <Circle
              center={{ latitude: lat, longitude: lng }}
              radius={Math.max(accuracy, 20)}
              strokeColor="rgba(255, 42, 109, 0.7)"
              fillColor="rgba(255, 42, 109, 0.15)"
              strokeWidth={2}
            />
          )}

          {/* Movement Trail */}
          {Polyline && coordinatesTrail.length > 1 && (
            <Polyline
              coordinates={coordinatesTrail}
              strokeColor="#FF2A6D"
              strokeWidth={4}
              lineDashPattern={[6, 4]}
            />
          )}

          {/* Victim Marker */}
          {Marker && (
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
              title={victimName}
              description={`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
              pinColor="#FF2A6D"
            >
              <View style={styles.customPinContainer}>
                <View style={styles.pulseRing} />
                <View style={styles.pinDot}>
                  <Ionicons name="warning" size={14} color="#FFF" />
                </View>
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={styles.noMapsFallback}>
          <Ionicons name="map" size={40} color="#FF2A6D" />
          <Text style={styles.coordsText}>
            Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
          </Text>
        </View>
      )}

      {/* OVERLAY BADGE */}
      <View style={styles.badgeOverlay}>
        <View style={styles.pingDot} />
        <Text style={styles.badgeText}>LIVE GPS STREAM</Text>
      </View>

      {/* GOOGLE MAPS SHORTCUT BUTTON */}
      <TouchableOpacity
        style={styles.gmapsButton}
        onPress={openGoogleMaps}
        activeOpacity={0.8}
      >
        <Ionicons name="navigate" size={14} color="#FFF" />
        <Text style={styles.gmapsText}>OPEN MAPS</Text>
      </TouchableOpacity>

      {/* FULLSCREEN SHORTCUT BUTTON */}
      {onFullscreen && (
        <TouchableOpacity
          style={styles.fullscreenButton}
          onPress={onFullscreen}
          activeOpacity={0.8}
        >
          <Ionicons name="expand" size={16} color={COLORS.textDark} />
        </TouchableOpacity>
      )}

      {/* COORDINATES FOOTER */}
      <View style={styles.coordsFooter}>
        <Ionicons name="location" size={12} color="#FF2A6D" />
        <Text style={styles.coordsFooterText}>
          {lat.toFixed(5)}, {lng.toFixed(5)} • &plusmn;{accuracy}m
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFF0F3',
    borderWidth: 2,
    borderColor: '#FFCCE1',
  },
  placeholderContainer: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFF0F3',
    borderWidth: 2,
    borderColor: '#FFCCE1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 6,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  placeholderSub: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCCE1',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2A6D',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textDark,
    letterSpacing: 0.5,
  },
  gmapsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  gmapsText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCCE1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coordsFooter: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  coordsFooterText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  customPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 42, 109, 0.3)',
  },
  pinDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF2A6D',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMapsFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coordsText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
});
