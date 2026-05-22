import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
// Import theo đúng API v11
import { Map, Camera } from '@maplibre/maplibre-react-native';
import type { CameraRef, MapRef, PressEvent } from '@maplibre/maplibre-react-native';

// Import các tool components
import ZoomControl from './.bundle/components/zoomControl';
import DirectionTool from './.bundle/components/directionTools';
import PolygonTool from './.bundle/components/polygonTools';
import RulerTool from './.bundle/components/rulerTools';


const MAPTILER_KEY = 'cOKeOFdqtDvxTdbcV6bC';
const STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : 'https://demotiles.maplibre.org/style.json';

const INITIAL_VIEW_STATE = {
  zoom: 4.8,
  center: [108.2022, 16.0544] as [number, number], // Tọa độ miền Trung (Đà Nẵng)
};

// Giới hạn bản đồ trong khu vực Việt Nam (bao gồm cả đất liền, biển và các quần đảo Hoàng Sa, Trường Sa)
const VIETNAM_BOUNDS = [100.0, 5.0, 120.0, 25.5] as [number, number, number, number];

export interface MapClick {
  coordinate: [number, number];
  timestamp: number;
}

const App = () => {
  // Ref cho Map và Camera để điều khiển bản đồ
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  // State lưu công cụ đang hoạt động: null (chế độ xem bản đồ thường), 'direction', 'ruler', 'polygon'
  const [activeTool, setActiveTool] = useState<'direction' | 'ruler' | 'polygon' | null>(null);

  // State lưu tọa độ click mới nhất để truyền cho các tool
  const [lastClick, setLastClick] = useState<MapClick | null>(null);

  const handleSelectTool = (tool: 'direction' | 'ruler' | 'polygon' | null) => {
    setActiveTool(tool);
    setLastClick(null); // Reset click event để tránh kích hoạt công cụ mới lập tức
  };

  const handleZoomIn = async () => {
    if (!mapRef.current) return;
    try {
      const zoom = await mapRef.current.getZoom();
      const newZoom = Math.min(zoom + 1, 20);
      cameraRef.current?.zoomTo(newZoom, { duration: 300 });
    } catch (error) {
      console.warn('Lỗi khi lấy độ phóng đại:', error);
    }
  };

  const handleZoomOut = async () => {
    if (!mapRef.current) return;
    try {
      const zoom = await mapRef.current.getZoom();
      const newZoom = Math.max(zoom - 1, 0);
      cameraRef.current?.zoomTo(newZoom, { duration: 300 });
    } catch (error) {
      console.warn('Lỗi khi lấy độ phóng đại:', error);
    }
  };

  const handleMapPress = (
    event: NativeSyntheticEvent<PressEvent>,
  ) => {
    const coords = event.nativeEvent?.lngLat;
    if (coords) {
      // Bóc tách tọa độ lập tức và đóng gói cùng timestamp
      setLastClick({
        coordinate: [coords[0], coords[1]],
        timestamp: Date.now(),
      });
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        {/* Floating Toolbar ở phía trên bản đồ */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[styles.toolButton, activeTool === null && styles.activeToolButton]}
            onPress={() => handleSelectTool(null)}
          >
            <Text style={[styles.toolText, activeTool === null && styles.activeToolText]}>👁️ Xem</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolButton, activeTool === 'direction' && styles.activeToolButton]}
            onPress={() => handleSelectTool('direction')}
          >
            <Text style={[styles.toolText, activeTool === 'direction' && styles.activeToolText]}>🚗 Chỉ đường</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, activeTool === 'ruler' && styles.activeToolButton]}
            onPress={() => handleSelectTool('ruler')}
          >
            <Text style={[styles.toolText, activeTool === 'ruler' && styles.activeToolText]}>📐 Thước đo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, activeTool === 'polygon' && styles.activeToolButton]}
            onPress={() => handleSelectTool('polygon')}
          >
            <Text style={[styles.toolText, activeTool === 'polygon' && styles.activeToolText]}>⬡ Diện tích</Text>
          </TouchableOpacity>
        </View>

        <Map
          ref={mapRef}
          style={styles.map}
          mapStyle={STYLE_URL}
          onPress={handleMapPress}
          dragPan={true}
          touchZoom={true}
        >
          {/* Camera v11: dùng initialViewState kết hợp maxBounds giới hạn ở Việt Nam */}
          <Camera
            ref={cameraRef}
            initialViewState={INITIAL_VIEW_STATE}
            maxBounds={VIETNAM_BOUNDS}
          />

          {/* Render công cụ tương ứng với lựa chọn hiện tại */}
          {activeTool === 'direction' && (
            <DirectionTool lastClick={lastClick} />
          )}

          {activeTool === 'ruler' && (
            <RulerTool lastClick={lastClick} />
          )}

          {activeTool === 'polygon' && (
            <PolygonTool isActive={true} lastClick={lastClick} />
          )}
        </Map>

        {/* ZoomControl nằm ngoài Map, hiển thị overlay trên giao diện */}
        <ZoomControl onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  container: { 
    height: '100%', 
    width: '100%' 
  },
  map: { 
    flex: 1 
  },
  toolbar: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8, // Đổ bóng cho Android
    shadowColor: '#000', // Đổ bóng cho iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 100,
  },
  toolButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToolButton: {
    backgroundColor: '#007AFF', // Màu xanh iOS/Premium
  },
  toolText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  activeToolText: {
    color: '#fff',
  },
});

export default App;