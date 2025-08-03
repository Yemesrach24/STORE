import { useState, useEffect } from 'react';

type NetworkStatus = 'online' | 'offline' | 'unknown';

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('unknown');

  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    // Set initial status
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Cleanup
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  return {
    isOnline: networkStatus === 'online',
    isOffline: networkStatus === 'offline',
    status: networkStatus
  };
} 