import React, { useRef, useEffect, useState, useMemo, Component } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

// ---------------------------------------------------------------------------
// Native WebView Module Loader (Safe on Web, iOS, and Android)
// ---------------------------------------------------------------------------
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
  const [webViewFailed, setWebViewFailed] = useState(false);

  // Generate initial HTML template once on mount
  const trailSerialized = useMemo(() => {
    if (!Array.isArray(trail) || trail.length === 0) return '[]';
    return JSON.stringify(trail);
  }, [trail]);

  const initialHtml = useMemo(() => {
    const safeTrail = trailSerialized;
    const safeName = JSON.stringify(victimName || 'User');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" onerror="this.onerror=null;this.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #FAF5F7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-user-select: none;
      user-select: none;
    }
    #map {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      background: #FAF5F7;
      touch-action: pan-x pan-y pinch-zoom;
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
      -webkit-user-select: none;
      touch-action: manipulation;
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
  </style>
</head>
<body>
  <div id="map"></div>

  <div class="ctrl-box">
    <button class="btn-chip active" id="btn-follow" onclick="toggleFollow()">🎯 Lock Target</button>
    <button class="btn-chip" id="btn-satellite" onclick="toggleSatellite()">🗺️ Satellite</button>
  </div>

  <script>
    (function() {
      var oldLog = console.log, oldErr = console.error;
      function bridge(lvl, args) {
        try {
          var str = Array.prototype.slice.call(args).join(' ');
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONSOLE', lvl: lvl, msg: str }));
          }
        } catch(e) {}
      }
      console.log = function() { bridge('log', arguments); if (oldLog) oldLog.apply(console, arguments); };
      console.error = function() { bridge('error', arguments); if (oldErr) oldErr.apply(console, arguments); };
    })();

    var currentLat = ${lat};
    var currentLng = ${lng};
    var victimName = ${safeName};
    var isFollowing = true;
    var isSatellite = false;
    var map = null;
    var streetLayer = null, satLayer = null;
    var accuracyCircle = null, coreTrail = null, marker = null;
    var pendingCoords = null;

    function initMap() {
      if (typeof L === 'undefined') {
        setTimeout(initMap, 100);
        return;
      }
      if (map) return;

      try {
        // Standard 100% Free OpenStreetMap raster tiles (Zero API key required, reliable worldwide)
        streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap contributors'
        });

        satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Esri World Imagery'
        });

        var startLat = pendingCoords ? pendingCoords.lat : currentLat;
        var startLng = pendingCoords ? pendingCoords.lng : currentLng;
        var startAcc = pendingCoords ? pendingCoords.acc : (${accuracy || 15});

        map = L.map('map', {
          center: [startLat, startLng],
          zoom: 16,
          zoomControl: false,
          layers: [streetLayer]
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Force Leaflet container recalculation on modal opening
        function doInvalidate() {
          if (map) {
            try { map.invalidateSize(); } catch(e) {}
          }
        }
        doInvalidate();
        setTimeout(doInvalidate, 100);
        setTimeout(doInvalidate, 300);
        setTimeout(doInvalidate, 700);
        setTimeout(doInvalidate, 1500);
        window.addEventListener('resize', doInvalidate);

        // Standard Emergency Red Pin Marker (Identical to Web Client)
        var redPinIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [28, 45],
          iconAnchor: [14, 45],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        // Accuracy Circle centered directly at victim coordinates
        accuracyCircle = L.circle([startLat, startLng], {
          radius: Math.max(Number(startAcc) || 15, 10),
          color: '#E62E5C',
          fillColor: '#E62E5C',
          fillOpacity: 0.18,
          weight: 2
        }).addTo(map);

        // Target Red Pin Marker positioned precisely at victim coordinates
        marker = L.marker([startLat, startLng], {
          icon: redPinIcon,
          zIndexOffset: 1000
        }).addTo(map);

        var popupHtml = '<div style="font-size:12px;font-family:sans-serif;line-height:1.5;min-width:140px;">' +
          '<b style="color:#2D142C;font-size:13px;">' + (victimName || 'User') + '</b><br/>' +
          '<span style="color:#E62E5C;font-weight:800;font-size:10px;">🚨 EMERGENCY SOS</span><br/>' +
          '<span style="color:#555;font-size:10.5px;font-family:monospace;">' + startLat.toFixed(5) + ', ' + startLng.toFixed(5) + '</span><br/>' +
          '<span style="color:#777;font-size:10px;">GPS: &plusmn;' + Math.round(startAcc || 15) + 'm</span>' +
          '</div>';
        marker.bindPopup(popupHtml).openPopup();

        // Clean movement trajectory trail (only if multiple movement breadcrumbs exist)
        var initialPts = (pendingCoords && pendingCoords.trail ? pendingCoords.trail : (${safeTrail} || [])).map(function(p) {
          return [parseFloat(p.latitude), parseFloat(p.longitude)];
        }).filter(function(pt) {
          return !isNaN(pt[0]) && !isNaN(pt[1]);
        });

        if (initialPts.length > 2) {
          coreTrail = L.polyline(initialPts, {
            color: '#E62E5C',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '6, 6'
          }).addTo(map);
        }

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

        notifyReady();
      } catch (err) {
        console.error('initMap error:', err && err.message);
      }
    }

    // Dynamic robust multi-CDN Leaflet loader
    function loadLeaflet(done) {
      if (typeof L !== 'undefined') return done();
      var cdnList = [
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
        'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js'
      ];
      var idx = 0;
      function next() {
        if (typeof L !== 'undefined') return done();
        if (idx >= cdnList.length) {
          console.error('All Leaflet CDNs exhausted');
          return;
        }
        var s = document.createElement('script');
        s.src = cdnList[idx++];
        s.onload = function() { done(); };
        s.onerror = function() { next(); };
        document.head.appendChild(s);
      }
      next();
    }

    loadLeaflet(function() {
      initMap();
    });

    window.updateLiveLocation = function(newLat, newLng, newAcc, trailData) {
      var parsedLat = parseFloat(newLat);
      var parsedLng = parseFloat(newLng);
      if (isNaN(parsedLat) || isNaN(parsedLng)) return;

      currentLat = parsedLat;
      currentLng = parsedLng;
      var pos = [currentLat, currentLng];

      pendingCoords = {
        lat: currentLat,
        lng: currentLng,
        acc: newAcc,
        trail: trailData
      };

      if (!map) return;

      try {
        map.invalidateSize();
      } catch(e) {}

      if (marker) {
        marker.setLatLng(pos);
        var updatedPopup = '<div style="font-size:12px;font-family:sans-serif;line-height:1.5;min-width:140px;">' +
          '<b style="color:#2D142C;font-size:13px;">' + (victimName || 'User') + '</b><br/>' +
          '<span style="color:#E62E5C;font-weight:800;font-size:10px;">🚨 LIVE SOS LOCATION</span><br/>' +
          '<span style="color:#555;font-size:10.5px;font-family:monospace;">' + currentLat.toFixed(5) + ', ' + currentLng.toFixed(5) + '</span><br/>' +
          '<span style="color:#777;font-size:10px;">GPS: &plusmn;' + Math.round(newAcc || 15) + 'm</span>' +
          '</div>';
        marker.setPopupContent(updatedPopup);
      }
      if (accuracyCircle) {
        accuracyCircle.setLatLng(pos);
        accuracyCircle.setRadius(Math.max(Number(newAcc) || 15, 10));
      }

      var pts = (trailData && trailData.length > 0) ? trailData.map(function(p) {
        return [parseFloat(p.latitude), parseFloat(p.longitude)];
      }).filter(function(pt) {
        return !isNaN(pt[0]) && !isNaN(pt[1]);
      }) : [];

      if (coreTrail && pts.length > 2) {
        coreTrail.setLatLngs(pts);
      } else if (!coreTrail && pts.length > 2 && map) {
        coreTrail = L.polyline(pts, {
          color: '#E62E5C',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(map);
      }

      if (isFollowing && map) {
        map.panTo(pos, { animate: true, duration: 0.8 });
      }
    };

    window.toggleFollow = function() {
      isFollowing = !isFollowing;
      var btn = document.getElementById('btn-follow');
      if (isFollowing) {
        if (btn) {
          btn.classList.add('active');
          btn.innerText = '🎯 Lock Target';
        }
        if (map) {
          map.panTo([currentLat, currentLng], { animate: true, duration: 0.8 });
        }
      } else {
        if (btn) {
          btn.classList.remove('active');
          btn.innerText = '🎯 Free Pan';
        }
      }
    };

    window.toggleSatellite = function() {
      if (!map || !streetLayer || !satLayer) return;
      isSatellite = !isSatellite;
      var btn = document.getElementById('btn-satellite');
      if (isSatellite) {
        map.removeLayer(streetLayer);
        map.addLayer(satLayer);
        if (btn) {
          btn.classList.add('active');
          btn.innerText = '🗺️ Street Map';
        }
      } else {
        map.removeLayer(satLayer);
        map.addLayer(streetLayer);
        if (btn) {
          btn.classList.remove('active');
          btn.innerText = '🗺️ Satellite';
        }
      }
    };

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
      } else if (webViewRef.current && typeof webViewRef.current.injectJavaScript === 'function') {
        const script = `
          (function() {
            try {
              if (typeof window.updateLiveLocation === 'function') {
                window.updateLiveLocation(${lat}, ${lng}, ${accuracy || 15}, ${trailSerialized});
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
    try {
      pushUpdate();
    } catch (e) {}

    const handleMessage = (e) => {
      try {
        if (e.data && e.data.type === 'LEAFLET_READY') {
          pushUpdate();
        }
      } catch (e) {}
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      try {
        window.addEventListener('message', handleMessage);
      } catch (e) {}
    }

    const t1 = setTimeout(() => { try { pushUpdate(); } catch (e) {} }, 300);
    const t2 = setTimeout(() => { try { pushUpdate(); } catch (e) {} }, 800);
    const t3 = setTimeout(() => { try { pushUpdate(); } catch (e) {} }, 1500);

    return () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        try {
          window.removeEventListener('message', handleMessage);
        } catch (e) {}
      }
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [lat, lng, accuracy, trailSerialized]);

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
            try {
              pushUpdate();
              setTimeout(pushUpdate, 300);
            } catch (e) {}
          },
        })}
      </View>
    );
  }

  if (WebView && !webViewFailed) {
    return (
      <View style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: initialHtml, baseUrl: 'https://unpkg.com' }}
          style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#FAF5F7' }}
          containerStyle={{ flex: 1, width: '100%', height: '100%' }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          {...Platform.select({
            ios: {
              bounces: false,
              useWebKit: true,
              allowsInlineMediaPlayback: true,
              dataDetectorTypes: 'none',
            },
            android: {
              androidHardwareAccelerationDisabled: false,
              androidLayerType: 'none',
              mixedContentMode: 'always',
            },
          })}
          onError={(syntheticEvent) => {
            console.log('[LiveSosMap WebView] Load warning:', syntheticEvent?.nativeEvent?.description);
          }}
          onHttpError={() => {}}
          onRenderProcessGone={(event) => {
            console.warn('[LiveSosMap WebView] Render process gone, switching to safe fallback');
            setWebViewFailed(true);
            return true;
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data && data.type === 'CONSOLE') {
                console.log('[LiveSosMap WebView ' + data.lvl + ']', data.msg);
              }
              if (data && data.type === 'LEAFLET_READY') {
                pushUpdate();
              }
            } catch (e) {}
          }}
          onLoadEnd={() => {
            try {
              pushUpdate();
              setTimeout(() => { try { pushUpdate(); } catch (e) {} }, 150);
              setTimeout(() => { try { pushUpdate(); } catch (e) {} }, 500);
              setTimeout(() => { try { pushUpdate(); } catch (e) {} }, 1000);
            } catch (e) {}
          }}
        />
      </View>
    );
  }

  const safeLatText = Number(lat || 0).toFixed(5);
  const safeLngText = Number(lng || 0).toFixed(5);

  return (
    <View style={styles.noMapsFallback}>
      <Ionicons name="navigate-circle" size={38} color="#FF2A6D" />
      <Text style={styles.fallbackTitle}>Live GPS Telemetry Stream</Text>
      <Text style={styles.coordsText}>
        {safeLatText}, {safeLngText} (&plusmn;{accuracy}m)
      </Text>
    </View>
  );
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

  // Open native navigation app on device safely (Apple Maps on iOS, Google Maps on Android)
  const openExternalMaps = async () => {
    if (!isValid) return;
    try {
      const label = encodeURIComponent(victimName || 'Emergency Victim Location');
      const nativeUrl = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      });
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      const can = await Linking.canOpenURL(nativeUrl).catch(() => false);
      if (can) {
        await Linking.openURL(nativeUrl).catch(() => Linking.openURL(webUrl).catch(() => {}));
      } else {
        await Linking.openURL(webUrl).catch(() => {});
      }
    } catch (e) {
      console.log('[LiveSosMap] Open external maps error:', e?.message);
    }
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
      <View style={styles.badgeOverlay} pointerEvents="none">
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
      <View style={styles.coordsFooter} pointerEvents="none">
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
