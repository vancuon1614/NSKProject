import React, { useState, useEffect, useCallback } from 'react';
import { GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import { View, Button, StyleSheet } from 'react-native';

interface DirectionToolProps {
  lastClick?: { coordinate: [number, number]; timestamp: number } | null;
}
const DirectionTool: React.FC<DirectionToolProps> = ({ lastClick }) => {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  // Hàm gọi API của OSRM để lấy tuyến đường
  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      // OSRM yêu cầu tọa độ theo định dạng: {longitude},{latitude}
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.routes && json.routes.length > 0) {
        // Lấy dữ liệu dạng GeoJSON từ server trả về
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
  // Xử lý sự kiện chạm bản đồ từ parent
  useEffect(() => {
    if (!lastClick) return;
    const coords = lastClick.coordinate;
    if (!origin) {
      setOrigin(coords);
    } else if (!destination) {
      setDestination(coords);
    }
  }, [lastClick]);
  // Lắng nghe sự thay đổi của 2 điểm để tự động gọi API
  useEffect(() => {
    if (origin && destination) {
      fetchRoute(origin, destination);
    }
  }, [origin, destination]);
  const clearRoute = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setRouteData(null);
  }, []);
  return (
    <>
      {/* Nút reset tuyến đường */}
      <View style={styles.controlPanel}>
        <Button title="Xóa tuyến đường" onPress={clearRoute} color="#ff3333" />
      </View>
      {/* Hiển thị marker cho điểm đi và đến */}
      {origin && (
        <Marker id="origin" lngLat={origin}>
          {/* Chấm tròn màu xanh lá = điểm đi */}
          <View style={{ width: 20, height: 20, backgroundColor: 'green', borderRadius: 10, borderWidth: 2, borderColor: 'white' }} />
        </Marker>
      )}
      {destination && (
        <Marker id="destination" lngLat={destination}>
          {/* Chấm tròn màu đỏ = điểm đến */}
          <View style={{ width: 20, height: 20, backgroundColor: 'red', borderRadius: 10, borderWidth: 2, borderColor: 'white' }} />
        </Marker>
      )}
      {/* Vẽ đường đi nối giữa 2 điểm */}
      {routeData && (
        <GeoJSONSource id="routeSource" data={routeData}>
          <Layer
            id="routeLine"
            type="line"
            paint={{
              'line-color': '#3887be',
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
  controlPanel: {
    position: 'absolute',
    top: 110,
    right: 10,
    zIndex: 10,
  },
});
export default DirectionTool;