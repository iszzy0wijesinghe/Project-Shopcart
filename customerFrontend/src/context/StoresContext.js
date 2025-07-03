import { createContext, useState, useEffect, useContext } from 'react';
import { useLocation } from './LocationContext';
import api from '../services/custApi';
import { useNavigate } from 'react-router-dom';

const StoresContext = createContext();

export function useStores() {
    const context = useContext(StoresContext);
    if (!context) {
      throw new Error("useStores must be used within a StoresProvider");
    }
    return context;
}

export const StoresProvider = ({ children }) => {
  const navigate = useNavigate();
  const { location } = useLocation();
  const [stores, setStores] = useState([]);
  const [currentStoreId, setCurrentStoreId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // available filters: all, fastest, offers, instoreprices

//   const defaultCoords = { latitude: 6.9155229, longitude: 79.9739523 };

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const lat = location.lat;
      const lng = location.lng;
      let query = `?latitude=${lat}&longitude=${lng}`;
      if (filter !== 'all') {
        query += `&filter=${filter}`;
      }
      // Adjust the endpoint as needed.
      const response = await fetch(`http://localhost:8090/api/cust/stores/nearby${query}`);
      const data = await response.json();
      if (data.status === 'success') {
        setStores(data.data);
      } else {
        setStores([]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    }
    setIsLoading(false);
  };

  // Re-fetch whenever the user's location or filter changes.
  useEffect(() => {
    if (!location || !location.lat || !location.lng){
        setIsLoading(false);
        return;
    }
    fetchStores();
  }, [location, filter]);

  const selectStore = (storeId) => {
    setCurrentStoreId(storeId);
    navigate(`/store/${storeId}`);
  };

  // New function: returns the store object given the store id
  const getStoreById = (storeId) => {
    return stores.find(store => store._id === storeId);
  };

  const isStoreAccessible = (storeId) => {
    return stores.some(store => store._id === storeId);
  };

  // returns only the store IDs from the stores array
  const getStoreIds = () => {
    return stores.map(store => store._id);
  };

  const value = {
    // currentStoreId,
    stores,
    isLoading,
    filter,
    setFilter,
    fetchStores,
    getStoreById,
    selectStore,
    isStoreAccessible,
    getStoreIds
  };

  return (
    <StoresContext.Provider value={value}>
      {children}
    </StoresContext.Provider>
  );
};

export default StoresContext;