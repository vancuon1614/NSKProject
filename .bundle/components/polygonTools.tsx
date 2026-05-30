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
    
    // Kiểm tra đa giác tự cắt chéo (kinks)
    let hasKinks = false;
    try {
      const kinks = turf.kinks(polygonFeature);
      if (kinks.features.length > 0) {
        hasKinks = true;
      }
    } catch (e) {
      console.warn('Lỗi khi kiểm tra tự giao cắt của đa giác:', e);
    }

    // Tính diện tích (mét vuông -> chuyển sang km vuông)
    const areaSqMeters = turf.area(polygonFeature);
    const areaSqKm = (areaSqMeters / 1000000).toFixed(2);
    
    // Tìm tâm của hình để đặt Text
    const centroid = turf.centroid(polygonFeature);

    return {
      polygon: polygonFeature,
      centroid: centroid,
      areaText: `${areaSqKm} km²`,
      hasKinks,
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
          <View style={styles.dot}>
            <Text style={styles.dotText}>{index + 1}</Text>
          </View>
        </Marker>
      ))}

      {/* Vẽ vùng đa giác */}
      {polygonData && (
        <GeoJSONSource id="polygonSource" data={polygonData.polygon}>
          <Layer
            id="polygonFill"
            type="fill"
            paint={{
              'fill-color': polygonData.hasKinks ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 165, 0, 0.3)',
              'fill-outline-color': polygonData.hasKinks ? '#FF3B30' : 'orange',
            }}
          />
        </GeoJSONSource>
      )}

      {/* Hiển thị diện tích ở tâm đa giác (GeoJSONSource riêng biệt) */}
      {polygonData && !polygonData.hasKinks && (
        <GeoJSONSource id="centroidSource" data={polygonData.centroid}>
          <Layer
            id="areaLabel"
            type="symbol"
            layout={{
              'text-field': polygonData.areaText,
              'text-size': 14,
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            }}
            paint={{
              'text-color': '#007AFF',
              'text-halo-color': 'white',
              'text-halo-width': 2.5,
            }}
          />
        </GeoJSONSource>
      )}

      {/* Giao diện hiển thị kết quả đo & cảnh báo lỗi & nút Xóa */}
      <View style={styles.controlContainer}>
        <Text style={styles.titleText}>⬡ Đo Diện Tích Vùng</Text>
        
        {coordinates.length < 3 ? (
          <Text style={styles.infoText}>Chấm từ 3 điểm trở lên trên bản đồ để tính diện tích.</Text>
        ) : (
          <View style={styles.resultsWrapper}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Diện tích tính toán:</Text>
              <Text style={[styles.resultValue, polygonData?.hasKinks && styles.resultValueWarning]}>
                {polygonData?.areaText}
              </Text>
            </View>

            {polygonData?.hasKinks && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Hình vẽ bị tự giao cắt chéo (các cạnh cắt nhau). Hãy vẽ các điểm theo vòng tròn khép kín để đo chính xác!
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearText}>Xóa vùng vẽ</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 18,
    height: 18,
    backgroundColor: 'orange',
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  dotText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  controlContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  titleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultsWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  resultValueWarning: {
    color: '#FF3B30',
    textDecorationLine: 'line-through',
  },
  warningBox: {
    backgroundColor: '#FFEBE9',
    borderColor: '#FFC1C0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: '100%',
    marginTop: 4,
  },
  warningText: {
    color: '#D1242F',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  clearText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default PolygonTool;