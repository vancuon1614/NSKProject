import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

interface ZoomControlProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControl = ({ onZoomIn, onZoomOut }: ZoomControlProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onZoomIn}>
        <Text style={styles.text}>+</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <TouchableOpacity style={styles.button} onPress={onZoomOut}>
        <Text style={styles.text}>-</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5, // Đổ bóng cho hệ điều hành Android
    shadowColor: '#000', // Đổ bóng cho hệ điều hành iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default ZoomControl;