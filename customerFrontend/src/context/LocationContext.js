import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';

export const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Try to load saved location from localStorage on initial render
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    const savedAddress = localStorage.getItem('userAddress');
    
    if (savedLocation && savedAddress) {
      setLocation(JSON.parse(savedLocation));
      setAddress(JSON.parse(savedAddress));
    } else {
      // Attempt to get user's location automatically
      requestUserLocation();
    }
  }, []);

  // Listen for changes to the geolocation permission.
  // When the user grants permission, update the location automatically.
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        permissionStatus.onchange = function() {
          if (this.state === 'granted') {
            // Automatically update the location when permission is granted.
            requestUserLocation();
          }
        };
      });
    }
  }, []);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationData = { lat: latitude, lng: longitude };
          
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          // Format address
          const addressComponents = data.address;
          const formattedAddress = {
            street: addressComponents.road || '',
            city: addressComponents.city || addressComponents.town || '',
            state: addressComponents.state || '',
            zipCode: addressComponents.postcode || '',
            fullAddress: data.display_name
          };
          
          // Save to state and localStorage
          setLocation(locationData);
          setAddress(formattedAddress);
          localStorage.setItem('userLocation', JSON.stringify(locationData));
          localStorage.setItem('userAddress', JSON.stringify(formattedAddress));
          toast.success('Location detected successfully');
          window.location.reload();
        } catch (err) {
          console.error('Error getting address:', err);
          setError('Failed to determine your address');
          toast.error('Failed to determine your location');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error getting location:', err);
        setError('Failed to determine your location');
        setLoading(false);
        toast.error('Failed to access your location. Please enter it manually.');
      }
    );
  };

  const updateLocation = async (newAddress) => {
    setLoading(true);
    setError(null);
    
    try {
      // Geocode the address to get coordinates
      const query = encodeURIComponent(
        `${newAddress.street}, ${newAddress.city}, ${newAddress.state} ${newAddress.zipCode}`
      );
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
      );
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Address not found');
      }
      
      const locationData = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      
      // Update state and localStorage
      setLocation(locationData);
      setAddress({
        ...newAddress,
        fullAddress: data[0].display_name
      });
      
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      localStorage.setItem('userAddress', JSON.stringify(newAddress));
      
      toast.success('Location updated successfully');
      return { location: locationData, address: newAddress };
    } catch (err) {
      console.error('Error updating location:', err);
      setError('Failed to update location');
      toast.error('Failed to update location. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    location,
    setLocation,
    address,
    setAddress,
    loading,
    error,
    requestUserLocation,
    updateLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};