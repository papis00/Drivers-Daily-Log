import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const RouteMap = ({ tripData }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [routeError, setRouteError] = useState(null);

  // Custom icons for different types of markers
  const createCustomIcon = (color, symbol) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${symbol}</div>
      `,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const icons = {
    current: createCustomIcon('#ef4444', 'C'),
    pickup: createCustomIcon('#22c55e', 'P'),
    dropoff: createCustomIcon('#3b82f6', 'D'),
    rest: createCustomIcon('#f59e0b', 'R'),
    fuel: createCustomIcon('#8b5cf6', 'F')
  };

  useEffect(() => {
    if (!tripData || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        setLoading(true);
        setRouteError(null);

        // Initialize map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        mapInstanceRef.current = L.map(mapRef.current).setView([39.8283, -98.5795], 4);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);

        // Get coordinates for locations
        const locations = await Promise.all([
          geocodeLocation(tripData.current_location),
          geocodeLocation(tripData.pickup_location),
          geocodeLocation(tripData.dropoff_location)
        ]);

        const [currentCoords, pickupCoords, dropoffCoords] = locations;

        // Add markers
        L.marker([currentCoords.lat, currentCoords.lng], { icon: icons.current })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-blue-900">Current Location</h3>
              <p class="text-sm">${tripData.current_location}</p>
              <p class="text-xs text-gray-600 mt-1">Cycle Used: ${tripData.current_cycle_used}h</p>
            </div>
          `);

        L.marker([pickupCoords.lat, pickupCoords.lng], { icon: icons.pickup })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-green-700">Pickup Location</h3>
              <p class="text-sm">${tripData.pickup_location}</p>
              <p class="text-xs text-gray-600 mt-1">Est. 1 hour for loading</p>
            </div>
          `);

        L.marker([dropoffCoords.lat, dropoffCoords.lng], { icon: icons.dropoff })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-blue-700">Dropoff Location</h3>
              <p class="text-sm">${tripData.dropoff_location}</p>
              <p class="text-xs text-gray-600 mt-1">Est. 1 hour for unloading</p>
            </div>
          `);

        // Get and display route
        const routeCoords = await getRouteCoordinates(
          [currentCoords.lat, currentCoords.lng],
          [pickupCoords.lat, pickupCoords.lng],
          [dropoffCoords.lat, dropoffCoords.lng]
        );

        if (routeCoords && routeCoords.length > 0) {
          // Draw route polyline
          const routeLine = L.polyline(routeCoords, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8
          }).addTo(mapInstanceRef.current);

          // Add fuel stop markers (approximately every 1000 miles)
          addFuelStops(routeCoords, tripData.total_distance);

          // Add rest area markers based on daily logs
          addRestStops(tripData.daily_logs);

          // Fit map to show all markers and route
          const group = new L.featureGroup([
            L.marker([currentCoords.lat, currentCoords.lng]),
            L.marker([pickupCoords.lat, pickupCoords.lng]),
            L.marker([dropoffCoords.lat, dropoffCoords.lng]),
            routeLine
          ]);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setRouteError('Unable to load route. Please check the locations.');
        setLoading(false);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tripData]);

  // Geocoding function using Nominatim (free OpenStreetMap service)
  const geocodeLocation = async (location) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    throw new Error(`Location not found: ${location}`);
  };

  // Get route coordinates using OSRM (free routing service)
  const getRouteCoordinates = async (start, pickup, dropoff) => {
    try {
      // Route from current to pickup
      const route1Response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${pickup[1]},${pickup[0]}?geometries=geojson`
      );
      const route1Data = await route1Response.json();

      // Route from pickup to dropoff
      const route2Response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}?geometries=geojson`
      );
      const route2Data = await route2Response.json();

      let allCoords = [];
      
      if (route1Data.routes && route1Data.routes[0]) {
        const coords1 = route1Data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        allCoords = allCoords.concat(coords1);
      }

      if (route2Data.routes && route2Data.routes[0]) {
        const coords2 = route2Data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        allCoords = allCoords.concat(coords2);
      }

      return allCoords;
    } catch (error) {
      console.error('Error getting route:', error);
      return [];
    }
  };

  // Add fuel stop markers
  const addFuelStops = (routeCoords, totalDistance) => {
    if (!totalDistance || totalDistance < 1000) return;

    const fuelStops = Math.floor(totalDistance / 1000);
    const coordInterval = Math.floor(routeCoords.length / (fuelStops + 1));

    for (let i = 1; i <= fuelStops; i++) {
      const coordIndex = i * coordInterval;
      if (routeCoords[coordIndex]) {
        L.marker(routeCoords[coordIndex], { icon: icons.fuel })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-purple-700">Fuel Stop ${i}</h3>
              <p class="text-xs text-gray-600">Approximately ${i * 1000} miles</p>
            </div>
          `);
      }
    }
  };

  // Add rest area markers based on daily logs
  const addRestStops = (dailyLogs) => {
    if (!dailyLogs || dailyLogs.length === 0) return;

    dailyLogs.forEach((log, index) => {
      if (log.rest_periods && log.rest_periods.length > 0) {
        // For demo purposes, place rest stops along the route
        // In a real app, you'd have actual coordinates for rest areas
        const routeLength = mapInstanceRef.current ? 
          Object.keys(mapInstanceRef.current._layers).length : 0;
        
        log.rest_periods.forEach((rest, restIndex) => {
          // This is a simplified placement - in reality you'd use actual rest area coordinates
          L.marker([40 + index, -100 + restIndex * 5], { icon: icons.rest })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-bold text-orange-700">Rest Area</h3>
                <p class="text-sm">Day ${index + 1}</p>
                <p class="text-xs text-gray-600">${rest.duration || '10 hours'} rest</p>
              </div>
            `);
        });
      }
    });
  };

  if (!tripData) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">Enter trip details to view route map</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trip Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Trip Distance</h3>
          <p className="text-2xl font-bold text-blue-700">
            {tripData.total_distance?.toLocaleString() || 'N/A'} miles
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">Driving Time</h3>
          <p className="text-2xl font-bold text-green-700">
            {tripData.total_duration || 'N/A'} hours
          </p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-2">Trip Duration</h3>
          <p className="text-2xl font-bold text-orange-700">
            {tripData.daily_logs?.length || 0} days
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-600 font-medium">Loading route...</span>
            </div>
          </div>
        )}
        
        {routeError && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
            <div className="text-center p-6">
              <div className="text-red-600 mb-2">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Route Error</h3>
              <p className="text-red-600">{routeError}</p>
            </div>
          </div>
        )}

        <div 
          ref={mapRef} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
        />
        
        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md z-10">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Map Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">C</div>
              <span>Current Location</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">P</div>
              <span>Pickup</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">D</div>
              <span>Dropoff</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">R</div>
              <span>Rest Areas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">F</div>
              <span>Fuel Stops</span>
            </div>
          </div>
        </div>
      </div>

      {/* Route Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3">Route Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>From:</strong> {tripData.current_location}</p>
            <p><strong>Pickup:</strong> {tripData.pickup_location}</p>
            <p><strong>Destination:</strong> {tripData.dropoff_location}</p>
          </div>
          <div>
            <p><strong>Current Cycle:</strong> {tripData.current_cycle_used}h used</p>
            <p><strong>Estimated Fuel Stops:</strong> {Math.floor((tripData.total_distance || 0) / 1000) || 0}</p>
            <p><strong>Loading/Unloading:</strong> 2 hours total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;