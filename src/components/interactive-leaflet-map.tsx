'use client';

import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

// Same icon-asset fix as leaflet-map.tsx (the read-only display map).
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function DraggableMarker({
  position,
  onChange,
}: {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
}) {
  // Clicking anywhere on the map moves the marker there.
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: e => {
          const { lat, lng } = (e.target as L.Marker).getLatLng();
          onChange(lat, lng);
        },
      }}
    />
  );
}

// Picker variant of leaflet-map.tsx — position is controlled by the parent
// (LocationPickerModal) and reflects both click-to-move and marker-drag; the
// map itself is only ever centered once on mount (react-leaflet's Marker
// position prop is reactive, so this is enough to keep the pin in sync).
export default function InteractiveLeafletMap({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker position={[lat, lng]} onChange={onChange} />
    </MapContainer>
  );
}
