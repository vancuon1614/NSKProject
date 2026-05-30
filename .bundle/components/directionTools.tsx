import React, { useState, useEffect, useCallback } from 'react';
import { GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Keyboard } from 'react-native';

interface DirectionToolProps {
  lastClick?: { coordinate: [number, number]; timestamp: number } | null;
}

const DirectionTool: React.FC<DirectionToolProps> = ({ lastClick }) => {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [routeData, setRouteData] = useState<any>(null);

  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);
  const [startError, setStartError] = useState('');
  const [endError, setEndError] = useState('');

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Hàm gọi API của OSRM để lấy tuyến đường
  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.routes && json.routes.length > 0) {
        setRouteData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: json.routes[0].geometry,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Lỗi khi gọi API định tuyến:', error);
    }
  };

  // Hàm tìm tọa độ từ địa chỉ (Geocoding)
  const handleSearchStart = async () => {
    if (!startQuery.trim()) return;
    Keyboard.dismiss();
    setLoadingStart(true);
    setStartError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          startQuery
        )}&countrycodes=vn&limit=1`,
        {
          headers: {
            'User-Agent': 'NKSMobileMapApp/1.0',
          },
        }
      );
      const json = await response.json();
      if (json && json.length > 0) {
        const lat = parseFloat(json[0].lat);
        const lon = parseFloat(json[0].lon);
        setOrigin([lon, lat]);
        
        // Rút ngắn tên hiển thị để dễ nhìn
        const shortName = json[0].display_name.split(',')[0] || json[0].name;
        setStartQuery(shortName);
      } else {
        setStartError('Không tìm thấy địa chỉ');
      }
    } catch (e) {
      setStartError('Lỗi kết nối mạng');
    } finally {
      setLoadingStart(false);
    }
  };

  const handleSearchEnd = async () => {
    if (!endQuery.trim()) return;
    Keyboard.dismiss();
    setLoadingEnd(true);
    setEndError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          endQuery
        )}&countrycodes=vn&limit=1`,
        {
          headers: {
            'User-Agent': 'NKSMobileMapApp/1.0',
          },
        }
      );
      const json = await response.json();
      if (json && json.length > 0) {
        const lat = parseFloat(json[0].lat);
        const lon = parseFloat(json[0].lon);
        setDestination([lon, lat]);

        const shortName = json[0].display_name.split(',')[0] || json[0].name;
        setEndQuery(shortName);
      } else {
        setEndError('Không tìm thấy địa chỉ');
      }
    } catch (e) {
      setEndError('Lỗi kết nối mạng');
    } finally {
      setLoadingEnd(false);
    }
  };

  // Hàm chuyển tọa độ thành địa chỉ (Reverse Geocoding) khi click bản đồ
  const reverseGeocode = async (coords: [number, number], target: 'start' | 'end') => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lon=${coords[0]}&lat=${coords[1]}`,
        {
          headers: {
            'User-Agent': 'NKSMobileMapApp/1.0',
          },
        }
      );
      const json = await response.json();
      if (json && json.display_name) {
        const displayName = json.display_name;
        const parts = displayName.split(',');
        const shortName = parts[0] + (parts[1] ? `, ${parts[1].trim()}` : '');
        if (target === 'start') {
          setStartQuery(shortName);
        } else {
          setEndQuery(shortName);
        }
      } else {
        const fallback = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
        if (target === 'start') {
          setStartQuery(fallback);
        } else {
          setEndQuery(fallback);
        }
      }
    } catch (e) {
      console.warn('Lỗi reverse geocoding:', e);
      const fallback = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
      if (target === 'start') {
        setStartQuery(fallback);
      } else {
        setEndQuery(fallback);
      }
    }
  };

  // Xử lý sự kiện chạm bản đồ từ parent
  useEffect(() => {
    if (!lastClick) return;
    Keyboard.dismiss();
    const coords = lastClick.coordinate;
    if (!origin) {
      setOrigin(coords);
      reverseGeocode(coords, 'start');
    } else if (!destination) {
      setDestination(coords);
      reverseGeocode(coords, 'end');
    }
  }, [lastClick]);

  // Lắng nghe sự thay đổi của 2 điểm để tự động gọi API tuyến đường
  useEffect(() => {
    if (origin && destination) {
      fetchRoute(origin, destination);
    }
  }, [origin, destination]);

  const clearRoute = useCallback(() => {
    Keyboard.dismiss();
    setOrigin(null);
    setDestination(null);
    setRouteData(null);
    setStartQuery('');
    setEndQuery('');
    setStartError('');
    setEndError('');
  }, []);

  return (
    <>
      {/* Floating Card điều khiển tìm kiếm địa chỉ và lộ trình */}
      <View style={[styles.controlCard, keyboardVisible && styles.controlCardKeyboard]}>
        <Text style={styles.cardTitle}>🗺️ Chỉ đường & Tìm địa chỉ</Text>
        
        {/* Hàng nhập điểm đi */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, startError ? styles.inputError : null]}
            placeholder="Nhập địa chỉ bắt đầu hoặc click bản đồ..."
            placeholderTextColor="#999"
            value={startQuery}
            onChangeText={setStartQuery}
          />
          <TouchableOpacity 
            style={styles.searchBtn} 
            onPress={handleSearchStart}
            disabled={loadingStart}
          >
            {loadingStart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchBtnText}>Tìm</Text>
            )}
          </TouchableOpacity>
        </View>
        {startError ? <Text style={styles.errorText}>{startError}</Text> : null}

        {/* Hàng nhập điểm đến */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, endError ? styles.inputError : null]}
            placeholder="Nhập địa chỉ kết thúc hoặc click bản đồ..."
            placeholderTextColor="#999"
            value={endQuery}
            onChangeText={setEndQuery}
          />
          <TouchableOpacity 
            style={styles.searchBtn} 
            onPress={handleSearchEnd}
            disabled={loadingEnd}
          >
            {loadingEnd ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchBtnText}>Tìm</Text>
            )}
          </TouchableOpacity>
        </View>
        {endError ? <Text style={styles.errorText}>{endError}</Text> : null}

        {/* Nút xóa tuyến đường */}
        <TouchableOpacity style={styles.clearBtn} onPress={clearRoute}>
          <Text style={styles.clearBtnText}>Xóa tuyến đường</Text>
        </TouchableOpacity>
      </View>

      {/* Hiển thị marker cho điểm đi và đến */}
      {origin && (
        <Marker id="origin" lngLat={origin}>
          <View style={styles.originMarker}>
            <Text style={styles.markerText}>A</Text>
          </View>
        </Marker>
      )}
      {destination && (
        <Marker id="destination" lngLat={destination}>
          <View style={styles.destMarker}>
            <Text style={styles.markerText}>B</Text>
          </View>
        </Marker>
      )}

      {/* Vẽ đường đi nối giữa 2 điểm */}
      {routeData && (
        <GeoJSONSource id="routeSource" data={routeData}>
          <Layer
            id="routeLine"
            type="line"
            paint={{
              'line-color': '#007AFF',
              'line-width': 5,
            }}
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
          />
        </GeoJSONSource>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  controlCard: {
    position: 'absolute',
    top: 130,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  controlCardKeyboard: {
    top: 25, // Đẩy sát lên đỉnh màn hình khi bàn phím mở để không bao giờ bị che khuất
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  input: {
    flex: 1,
    height: 38,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 6,
    fontSize: 12,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ff3333',
  },
  searchBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 45,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3333',
    fontSize: 10,
    marginTop: -4,
    marginBottom: 6,
    marginLeft: 4,
  },
  clearBtn: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  clearBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  originMarker: {
    width: 24,
    height: 24,
    backgroundColor: '#34C759',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  destMarker: {
    width: 24,
    height: 24,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  markerText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default DirectionTool;