import React, { useRef, useEffect, useState, useMemo, Component } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

// ---------------------------------------------------------------------------
// Native Maps Module Loader (Safe on Web, iOS, and Android)
// ---------------------------------------------------------------------------
let MapView = null;
let Marker = null;
let Polyline = null;
let Circle = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    Circle = Maps.Circle;
  } catch (e) {
    console.log('[LiveSosMap] react-native-maps not available on this platform:', e?.message || e);
  }
}

let WebView = null;
if (Platform.OS !== 'web') {
  try {
    const WV = require('react-native-webview');
    WebView = WV.WebView || WV.default || WV;
  } catch (e) {
    console.log('[LiveSosMap] react-native-webview not available on this platform:', e?.message || e);
  }
}

// ---------------------------------------------------------------------------
// Map Error Boundary — Guarantees the app NEVER crashes from map render errors
// ---------------------------------------------------------------------------
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('[LiveSosMap] Native map error intercepted:', error?.message || error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.noMapsFallback}>
          <Ionicons name="map-outline" size={40} color="#FF2A6D" />
          <Text style={styles.fallbackTitle}>Map View Unavailable</Text>
          <Text style={styles.fallbackSub}>A native graphics context error occurred.</Text>
          {this.props.onOpenMaps && (
            <TouchableOpacity style={styles.fallbackBtn} onPress={this.props.onOpenMaps}>
              <Ionicons name="navigate" size={14} color="#FFF" />
              <Text style={styles.fallbackBtnText}>OPEN IN EXTERNAL MAPS</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Interactive Animated Universal Live Leaflet Map (Web & Mobile via WebView)
// ---------------------------------------------------------------------------
function UniversalLiveLeafletMap({ lat, lng, accuracy = 15, victimName = 'Victim Member', trail = [] }) {
  const iframeRef = useRef(null);
  const webViewRef = useRef(null);

  // Generate initial HTML template once on mount
  const initialHtml = useMemo(() => {
    const safeTrail = JSON.stringify(trail || []);
    const safeName = JSON.stringify(victimName || 'User');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #FAF5F7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    .radar-container {
      position: relative;
      width: 44px;
      height: 44px;
      margin-left: -22px;
      margin-top: -22px;
    }
    .radar-pulse {
      position: absolute;
      top: 0;
      left: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 42, 109, 0.4);
      animation: radarPulse 2s infinite ease-out;
    }
    .radar-pulse-2 {
      position: absolute;
      top: 0;
      left: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 42, 109, 0.25);
      animation: radarPulse 2s infinite ease-out 0.7s;
    }
    .radar-dot {
      position: absolute;
      top: 13px;
      left: 13px;
      width: 18px;
      height: 18px;
      background: linear-gradient(135deg, #FF5C8A, #FF2A6D);
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 14px rgba(255, 42, 109, 0.9), 0 3px 6px rgba(0,0,0,0.3);
      z-index: 10;
    }
    @keyframes radarPulse {
      0% { transform: scale(0.35); opacity: 1; }
      100% { transform: scale(3.2); opacity: 0; }
    }

    .ctrl-box {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .btn-chip {
      background: rgba(255, 255, 255, 0.95);
      color: #2D142C;
      border: 1px solid rgba(255, 42, 109, 0.2);
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      user-select: none;
    }
    .btn-chip:hover, .btn-chip:active {
      background: #FFF;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 42, 109, 0.2);
    }
    .btn-chip.active {
      background: #FF2A6D;
      color: #FFF;
      border-color: #FF2A6D;
    }

    .telemetry-hud {
      position: absolute;
      bottom: 12px;
      left: 12px;
      z-index: 1000;
      background: rgba(42, 8, 38, 0.9);
      color: #FFF;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.25);
      border: 1px solid rgba(255, 42, 109, 0.3);
      backdrop-filter: blur(4px);
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #34D399;
      animation: pulseBlink 1.4s infinite;
    }
    @keyframes pulseBlink {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.85); }
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <div class="ctrl-box">
    <button class="btn-chip active" id="btn-follow" onclick="toggleFollow()">🎯 Lock Target</button>
    <button class="btn-chip" id="btn-satellite" onclick="toggleSatellite()">🗺️ Satellite</button>
  </div>

  <div class="telemetry-hud">
    <div class="live-dot"></div>
    <span id="hud-label">LIVE TRACKING ACTIVE</span>
    <span style="opacity:0.35">|</span>
    <span id="hud-coords">--</span>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    var currentLat = ${lat};
    var currentLng = ${lng};
    var victimName = ${safeName};
    var isFollowing = true;
    var isSatellite = false;

    var streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    });

    var satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri World Imagery'
    });

    var map = L.map('map', {
      center: [currentLat, currentLng],
      zoom: 16,
      zoomControl: false,
      layers: [streetLayer]
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    var radarIcon = L.divIcon({
      className: 'radar-div-icon',
      html: '<div class="radar-container"><div class="radar-pulse"></div><div class="radar-pulse-2"></div><div class="radar-dot"></div></div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    var accuracyCircle = L.circle([currentLat, currentLng], {
      radius: ${accuracy || 15},
      color: '#FF2A6D',
      fillColor: '#FF2A6D',
      fillOpacity: 0.15,
      weight: 1.5
    }).addTo(map);

    var initialPts = (${safeTrail} || []).map(function(p) {
      return [parseFloat(p.latitude), parseFloat(p.longitude)];
    }).filter(function(pt) {
      return !isNaN(pt[0]) && !isNaN(pt[1]);
    });

    if (initialPts.length === 0 || initialPts[initialPts.length - 1][0] !== currentLat) {
      initialPts.push([currentLat, currentLng]);
    }

    var glowTrail = L.polyline(initialPts, {
      color: '#FF2A6D',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    var coreTrail = L.polyline(initialPts, {
      color: '#FF2A6D',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '8, 6',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    var marker = L.marker([currentLat, currentLng], {
      icon: radarIcon,
      zIndexOffset: 1000
    }).addTo(map);

    function updateHud(latVal, lngVal, accVal, count) {
      var el = document.getElementById('hud-coords');
      if (el) {
        el.innerText = latVal.toFixed(5) + ', ' + lngVal.toFixed(5) + ' (±' + Math.round(accVal) + 'm)';
      }
    }
    updateHud(currentLat, currentLng, ${accuracy || 15}, initialPts.length);

    window.updateLiveLocation = function(newLat, newLng, newAcc, trailData) {
      if (!map || !marker) return;
      currentLat = parseFloat(newLat);
      currentLng = parseFloat(newLng);
      var pos = [currentLat, currentLng];

      marker.setLatLng(pos);
      if (accuracyCircle) {
        accuracyCircle.setLatLng(pos);
        accuracyCircle.setRadius(Math.max(Number(newAcc) || 15, 10));
      }

      var pts = (trailData && trailData.length > 0) ? trailData.map(function(p) {
        return [parseFloat(p.latitude), parseFloat(p.longitude)];
      }).filter(function(pt) {
        return !isNaN(pt[0]) && !isNaN(pt[1]);
      }) : [];

      if (pts.length === 0 || pts[pts.length - 1][0] !== currentLat) {
        pts.push(pos);
      }

      glowTrail.setLatLngs(pts);
      coreTrail.setLatLngs(pts);

      if (isFollowing) {
        map.panTo(pos, { animate: true, duration: 0.8 });
      }

      updateHud(currentLat, currentLng, newAcc || 15, pts.length);
    };

    window.toggleFollow = function() {
      isFollowing = !isFollowing;
      var btn = document.getElementById('btn-follow');
      if (isFollowing) {
        btn.classList.add('active');
        btn.innerText = '🎯 Lock Target';
        map.panTo([currentLat, currentLng], { animate: true, duration: 0.8 });
      } else {
        btn.classList.remove('active');
        btn.innerText = '🎯 Free Pan';
      }
    };

    window.toggleSatellite = function() {
      isSatellite = !isSatellite;
      var btn = document.getElementById('btn-satellite');
      if (isSatellite) {
        map.removeLayer(streetLayer);
        map.addLayer(satLayer);
        btn.classList.add('active');
        btn.innerText = '🗺️ Street Map';
      } else {
        map.removeLayer(satLayer);
        map.addLayer(streetLayer);
        btn.classList.remove('active');
        btn.innerText = '🗺️ Satellite';
      }
    };

    map.on('dragstart', function() {
      if (isFollowing) {
        isFollowing = false;
        var btn = document.getElementById('btn-follow');
        if (btn) {
          btn.classList.remove('active');
          btn.innerText = '🎯 Free Pan';
        }
      }
    });

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'UPDATE_LOCATION') {
        window.updateLiveLocation(e.data.lat, e.data.lng, e.data.accuracy, e.data.trail);
      }
    });

    document.addEventListener('message', function(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.type === 'UPDATE_LOCATION') {
          window.updateLiveLocation(data.lat, data.lng, data.accuracy, data.trail);
        }
      } catch(err) {}
    });

    function notifyReady() {
      try {
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LEAFLET_READY' }));
        } else if (window.parent) {
          window.parent.postMessage({ type: 'LEAFLET_READY' }, '*');
        }
      } catch(err) {}
    }
    notifyReady();
    setTimeout(notifyReady, 400);
  </script>
</body>
</html>`;
  }, []);

  // Real-time update push into iframe (Web) or WebView (Native Android / iOS)
  const pushUpdate = () => {
    try {
      if (Platform.OS === 'web') {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow?.updateLiveLocation) {
          iframe.contentWindow.updateLiveLocation(lat, lng, accuracy, trail);
        } else if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'UPDATE_LOCATION',
            lat,
            lng,
            accuracy,
            trail,
          }, '*');
        }
      } else if (webViewRef.current) {
        const script = `
          (function() {
            try {
              if (typeof window.updateLiveLocation === 'function') {
                window.updateLiveLocation(${lat}, ${lng}, ${accuracy || 15}, ${JSON.stringify(trail || [])});
              }
            } catch(e) {}
          })();
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (e) {}
  };

  useEffect(() => {
    pushUpdate();

    const handleMessage = (e) => {
      if (e.data && e.data.type === 'LEAFLET_READY') {
        pushUpdate();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
    }

    const t1 = setTimeout(pushUpdate, 300);
    const t2 = setTimeout(pushUpdate, 800);
    const t3 = setTimeout(pushUpdate, 1500);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleMessage);
      }
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [lat, lng, accuracy, trail]);

  if (Platform.OS === 'web') {
    return (
      <View style={StyleSheet.absoluteFillObject}>
        {React.createElement('iframe', {
          ref: iframeRef,
          title: `Live Map - ${victimName}`,
          width: '100%',
          height: '100%',
          style: { border: 0, borderRadius: 20 },
          srcDoc: initialHtml,
          onLoad: () => {
            pushUpdate();
            setTimeout(pushUpdate, 300);
          },
        })}
      </View>
    );
  }

  if (WebView) {
    return (
      <View style={StyleSheet.absoluteFillObject}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: initialHtml }}
          style={{ flex: 1, backgroundColor: '#FAF5F7' }}
          containerStyle={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          androidHardwareAccelerationDisabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data && data.type === 'LEAFLET_READY') {
                pushUpdate();
              }
            } catch (e) {}
          }}
          onLoadEnd={() => {
            pushUpdate();
            setTimeout(pushUpdate, 300);
            setTimeout(pushUpdate, 800);
          }}
        />
      </View>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main LiveSosMap Component
// ---------------------------------------------------------------------------
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
  const internalTrailRef = useRef([]);

  // Strict number parsing and bounds checking to prevent native IllegalArgumentException crashes
  const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
  const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude);
  const isValid =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    (Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001);

  // Safe native camera animation
  useEffect(() => {
    let active = true;
    if (isValid && mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          800
        );
      } catch (err) {
        // Safe no-op if animation aborted or bridge disconnected
      }
    }
    if (isValid && active) {
      const trail = internalTrailRef.current;
      const last = trail[trail.length - 1];
      if (!last || last.latitude !== lat || last.longitude !== lng) {
        internalTrailRef.current = [...trail, { latitude: lat, longitude: lng }].slice(-50);
      }
    }
    return () => {
      active = false;
    };
  }, [lat, lng, isValid]);

  // Open native navigation app on device (Apple Maps on iOS, Google Maps intent on Android, Web Maps on Browser)
  const openExternalMaps = () => {
    if (!isValid) return;
    const label = encodeURIComponent(victimName || 'Emergency Victim Location');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    Linking.openURL(url).catch(() => {
      // Universal fallback to Google Maps web URL if native intent fails
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => {});
    });
  };

  // Strictly sanitize trail points (filter out corrupt GPS points)
  const safePropTrail = (history || [])
    .filter((pt) => pt && pt.latitude !== undefined && pt.longitude !== undefined)
    .map((pt) => ({
      latitude: typeof pt.latitude === 'number' ? pt.latitude : parseFloat(pt.latitude),
      longitude: typeof pt.longitude === 'number' ? pt.longitude : parseFloat(pt.longitude),
    }))
    .filter(
      (pt) =>
        !isNaN(pt.latitude) &&
        !isNaN(pt.longitude) &&
        isFinite(pt.latitude) &&
        isFinite(pt.longitude) &&
        pt.latitude >= -90 &&
        pt.latitude <= 90 &&
        pt.longitude >= -180 &&
        pt.longitude <= 180
    );

  const coordinatesTrail = safePropTrail.length > 0 ? safePropTrail : [...internalTrailRef.current];

  // Append latest point if not already present
  if (isValid && (!coordinatesTrail.length || coordinatesTrail[coordinatesTrail.length - 1].latitude !== lat)) {
    coordinatesTrail.push({ latitude: lat, longitude: lng });
  }

  // Placeholder when GPS signal is not yet available
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
      <MapErrorBoundary onOpenMaps={openExternalMaps}>
        {Platform.OS === 'web' || WebView ? (
          <UniversalLiveLeafletMap
            lat={lat}
            lng={lng}
            accuracy={accuracy}
            victimName={victimName}
            trail={coordinatesTrail}
          />
        ) : MapView ? (
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
                radius={Math.max(Number(accuracy) || 15, 20)}
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
                tracksViewChanges={false}
              >
                <View style={styles.customPinContainer}>
                  <View style={styles.pulseRing} />
                  <View style={styles.pinDot}>
                    <Ionicons name="warning" size={13} color="#FFF" />
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
            <TouchableOpacity style={styles.fallbackBtn} onPress={openExternalMaps}>
              <Ionicons name="navigate" size={14} color="#FFF" />
              <Text style={styles.fallbackBtnText}>OPEN IN MAPS APP</Text>
            </TouchableOpacity>
          </View>
        )}
      </MapErrorBoundary>

      {/* OVERLAY BADGE */}
      <View style={styles.badgeOverlay}>
        <View style={styles.pingDot} />
        <Text style={styles.badgeText}>LIVE GPS STREAM</Text>
      </View>

      {/* EXTERNAL MAPS SHORTCUT BUTTON */}
      <TouchableOpacity
        style={styles.gmapsButton}
        onPress={openExternalMaps}
        activeOpacity={0.8}
      >
        <Ionicons name="navigate" size={13} color="#FFF" />
        <Text style={styles.gmapsText}>OPEN MAPS</Text>
      </TouchableOpacity>

      {/* FULLSCREEN SHORTCUT BUTTON */}
      {onFullscreen && (
        <TouchableOpacity
          style={styles.fullscreenButton}
          onPress={onFullscreen}
          activeOpacity={0.8}
        >
          <Ionicons name="expand" size={15} color={COLORS.textDark} />
        </TouchableOpacity>
      )}

      {/* COORDINATES FOOTER */}
      <View style={styles.coordsFooter}>
        <Ionicons name="location" size={11} color="#FF2A6D" />
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
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FCE0E9',
  },
  placeholderContainer: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFF9FB',
    borderWidth: 1,
    borderColor: '#FCE0E9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 6,
  },
  placeholderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  placeholderSub: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCE0E9',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  pingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF2A6D',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: COLORS.textDark,
    letterSpacing: 0.4,
  },
  gmapsButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  gmapsText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCE0E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  coordsFooter: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCE0E9',
  },
  coordsFooterText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  customPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
  },
  pulseRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 42, 109, 0.25)',
  },
  pinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    padding: 16,
    backgroundColor: '#FFF8FA',
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  fallbackSub: {
    fontSize: 10.5,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 5,
    marginTop: 4,
  },
  fallbackBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
  },
});
