'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  status: 'registered' | 'updated' | 'error' | 'unsupported';
  registration?: ServiceWorkerRegistration;
}

export default function ServiceWorkerRegistration() {
  const [swState, setSwState] = useState<ServiceWorkerState>({ status: 'unsupported' });

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setSwState({ status: 'unsupported' });
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwState({ status: 'updated', registration });
              }
            });
          }
        });

        setSwState({ status: 'registered', registration });
      } catch (error) {
        setSwState({ status: 'error' });
      }
    };

    registerServiceWorker();

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  useEffect(() => {
    if (swState.status === 'updated') {
      const shouldUpdate = window.confirm(
        'Nueva versión disponible. ¿Deseas actualizar ahora?'
      );
      if (shouldUpdate) {
        swState.registration?.active?.postMessage('skipWaiting');
      }
    }
  }, [swState]);

  return null;
}

export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  const applyUpdate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('skipWaiting');
      window.location.reload();
    }
  };

  return { updateAvailable, applyUpdate };
}
