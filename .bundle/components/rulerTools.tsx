import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import * as turf from '@turf/turf';
import type { NativeSyntheticEvent } from 'react-native';
import type { PressEvent } from '@maplibre/maplibre-react-native';

/**
 * RulerTool - Công cụ đo khoảng cách trên bản đồ.
 *
 * Component này phải được render BÊN TRONG <Map>.
 * Parent cần truyền sự kiện onPress của Map vào prop `onMapPressEvent`.
 *
 * Ví dụ sử dụng trong App.tsx:
 * ```tsx
 * <Map onPress={(e) => setMapPressEvent(e)}>
 *   <Camera initialViewState={{ zoom: 5, center: [105.8342, 21.0278] }} />
 *   <RulerTool onMapPressEvent={mapPressEvent} />
 * </Map>
 * ```
 */

interface RulerToolProps {
  onMapPressEvent?: NativeSyntheticEvent<PressEvent> | null;
}

const RulerTool: React.FC<RulerToolProps> = ({ onMapPressEvent }) => {
  // State lưu trữ mảng các tọa độ người dùng đã chấm
  const [coordinates, setCoordinates] = useState<number[][]>([]);
  // State lưu trữ tổng khoảng cách
  const [distance, setDistance] = useState<number>(0);

  // Xử lý sự kiện chạm bản đồ từ parent
  useEffect(() => {
    if (!onMapPressEvent) return;

    // Lấy tọa độ từ event theo đúng API v11
    const newPoint = onMapPressEvent.nativeEvent.lngLat;

    setCoordinates(prev => {
      const newCoordinates = [...prev, newPoint];

      // Tính toán khoảng cách nếu có từ 2 điểm trở lên
      if (newCoordinates.length >= 2) {
        const lineString = turf.lineString(newCoordinates);
        const length = turf.length(lineString, { units: 'kilometers' });
        setDistance(length);
      }

      return newCoordinates;
    });
  }, [onMapPressEvent]);

  // Hàm reset thước đo
  const clearRuler = useCallback(() => {
    setCoordinates([]);
    setDistance(0);
  }, []);

  return (
    <>
      {/* Vẽ đường nối (Polyline) nếu có từ 2 điểm trở lên */}
      {coordinates.length >= 2 && (
        <GeoJSONSource
          id="ruler-source"
          data={turf.lineString(coordinates)}
        >
          <Layer
            id="ruler-line"
            type="line"
            paint={{
              'line-color': '#FF0000',
              'line-width': 3,
            }}
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
          />
        </GeoJSONSource>
      )}

      {/* Hiển thị các điểm (Points) đã chấm */}
      {coordinates.length > 0 && (
        <GeoJSONSource
          id="ruler-points"
          data={turf.multiPoint(coordinates)}
        >
          <Layer
            id="ruler-circles"
            type="circle"
            paint={{
              'circle-radius': 6,
              'circle-color': '#FFFFFF',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FF0000',
            }}
          />
        </GeoJSONSource>
      )}

      {/* Giao diện hiển thị khoảng cách và nút Xóa */}
      <View style={styles.infoBox}>
        <Text style={styles.distanceText}>
          Khoảng cách: {distance.toFixed(2)} km
        </Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearRuler}>
          <Text style={styles.clearText}>Xóa đo lường</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  infoBox: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  clearText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default RulerTool;