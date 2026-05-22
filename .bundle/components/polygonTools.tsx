import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import * as turf from '@turf/turf';

interface PolygonToolProps {
  isActive: boolean; // Prop để App.tsx quyết định khi nào bật tính năng này
  lastClick?: { coordinate: [number, number]; timestamp: number } | null;
}

const PolygonTool: React.FC<PolygonToolProps> = ({ isActive, lastClick }) => {
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);

  // Xử lý sự kiện chạm bản đồ từ parent
  useEffect(() => {
    if (!isActive || !lastClick) return;

    const coords = lastClick.coordinate;
    setCoordinates(prev => [...prev, coords]);
  }, [lastClick, isActive]);

  // Tính toán vùng, diện tích và tâm đa giác
  const polygonData = useMemo(() => {
    if (coordinates.length < 3) return null;

    // Turf yêu cầu đa giác khép kín (điểm cuối = điểm đầu)
    const closedCoordinates = [...coordinates, coordinates[0]];
    
    // Tạo GeoJSON hình đa giác
    const polygonFeature = turf.polygon([closedCoordinates]);
    
    // Tính diện tích (mét vuông -> chuyển sang km vuông)
    const areaSqMeters = turf.area(polygonFeature);
    const areaSqKm = (areaSqMeters / 1000000).toFixed(2);
    
    // Tìm tâm của hình để đặt Text
    const centroid = turf.centroid(polygonFeature);

    return {
      polygon: polygonFeature,
      centroid: centroid,
      areaText: `${areaSqKm} km²`,
    };
  }, [coordinates]);

  // Nút xóa (Clear) các điểm đã vẽ
  const handleClear = () => {
    setCoordinates([]);
  };

  if (!isActive) return null;

  return (
    <>
      {/* Vẽ các điểm đã chấm */}
      {coordinates.map((coord, index) => (
        <Marker
          key={`point-${index}`}
          id={`point-${index}`}
          lngLat={coord}
        >
          <View style={styles.dot} />
        </Marker>
      ))}

      {/* Vẽ vùng đa giác */}
      {polygonData && (
        <GeoJSONSource id="polygonSource" data={polygonData.polygon}>
          <Layer
            id="polygonFill"
            type="fill"
            paint={{
              'fill-color': 'rgba(255, 165, 0, 0.4)',
              'fill-outline-color': 'orange',
            }}
          />
        </GeoJSONSource>
      )}

      {/* Hiển thị diện tích ở tâm đa giác (GeoJSONSource riêng biệt, KHÔNG lồng nhau) */}
      {polygonData && (
        <GeoJSONSource id="centroidSource" data={polygonData.centroid}>
          <Layer
            id="areaLabel"
            type="symbol"
            layout={{
              'text-field': polygonData.areaText,
              'text-size': 16,
            }}
            paint={{
              'text-color': 'white',
              'text-halo-color': 'black',
              'text-halo-width': 2,
            }}
          />
        </GeoJSONSource>
      )}

      {/* Nút Clear nổi trên giao diện */}
      <View style={styles.controlContainer}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearText}>Xóa vùng vẽ</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 12,
    height: 12,
    backgroundColor: 'orange',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  controlContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 5, // Đổ bóng cho Android
    shadowColor: '#000', // Đổ bóng cho iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearText: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default PolygonTool;