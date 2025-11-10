// Web fallback for MapView - returns null since react-native-maps doesn't work on web
import React from 'react';
import { View } from 'react-native';

export default function MapView(props) {
  // Return null on web - map view is not supported
  return null;
}

