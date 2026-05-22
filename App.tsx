import React, { useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
// Import theo đúng API v11
import { Map, Camera } from '@maplibre/maplibre-react-native';
import type { CameraRef, PressEvent } from '@maplibre/maplibre-react-native';

// Import các tool components
import ZoomControl from './.bundle/components/zoomControl';
import DirectionTool from './.bundle/components/directionTools';
// import PolygonTool from './.bundle/components/polygonTools';
// import RulerTool from './.bundle/components/rulerTools';


const MAPTILER_KEY = 'cOKeOFdqtDvxTdbcV6bC';
const STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : 'https://demotiles.maplibre.org/style.json';


const App = () => {
  // Ref cho Camera để điều khiển zoom
  const cameraRef = useRef<CameraRef>(null);

  // State lưu sự kiện onPress để truyền cho các tool
  const [mapPressEvent, setMapPressEvent] = useState<NativeSyntheticEvent<PressEvent> | null>(null);

  // Zoom level hiện tại (để ZoomControl điều khiển)
  const [currentZoom, setCurrentZoom] = useState(5);

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 1, 20);
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, { duration: 300 });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 1, 0);
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, { duration: 300 });
  };

  const handleMapPress = (
    event: NativeSyntheticEvent<PressEvent>,
  ) => {
    // Chuyển tiếp sự kiện onPress cho các tool đang active
    setMapPressEvent(event);
  };

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <Map
          style={styles.map}
          mapStyle={STYLE_URL}
          onPress={handleMapPress}
        >
          {/* Camera v11: dùng initialViewState thay vì zoomLevel/centerCoordinate */}
          <Camera
            ref={cameraRef}
            initialViewState={{
              zoom: 5,
              center: [105.8342, 21.0278],
            }}
          />

          {/* DirectionTool - nhận sự kiện onPress từ Map */}
          <DirectionTool onMapPressEvent={mapPressEvent} />

          {/* Bật PolygonTool hoặc RulerTool khi cần:
          <PolygonTool isActive={true} onMapPressEvent={mapPressEvent} />
          <RulerTool onMapPressEvent={mapPressEvent} />
          */}
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
});

export default App;