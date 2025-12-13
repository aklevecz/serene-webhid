'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface HIDDeviceInfo {
  vendorId: number;
  productId: number;
  productName: string;
  collections: readonly HIDCollectionInfo[];
}

export interface InputReport {
  reportId: number;
  data: number[];
  timestamp: number;
}

export function useWebHID() {
  const [device, setDevice] = useState<HIDDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [inputReports, setInputReports] = useState<InputReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const deviceRef = useRef<HIDDevice | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('hid' in navigator)) {
      setIsSupported(false);
    }
  }, []);

  const handleInputReport = useCallback((event: HIDInputReportEvent) => {
    const data = Array.from(new Uint8Array(event.data.buffer));
    const report: InputReport = {
      reportId: event.reportId,
      data,
      timestamp: Date.now(),
    };
    setInputReports((prev) => [report, ...prev].slice(0, 100));
  }, []);

  const connect = useCallback(async (filters?: HIDDeviceFilter[]) => {
    if (!isSupported) {
      setError('WebHID is not supported in this browser');
      return null;
    }

    try {
      setError(null);
      const devices = await navigator.hid.requestDevice({
        filters: filters || [],
      });

      if (devices.length === 0) {
        setError('No device selected');
        return null;
      }

      const selectedDevice = devices[0];

      if (!selectedDevice.opened) {
        await selectedDevice.open();
      }

      selectedDevice.addEventListener('inputreport', handleInputReport);

      deviceRef.current = selectedDevice;
      setDevice(selectedDevice);
      setIsConnected(true);

      return selectedDevice;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
      return null;
    }
  }, [isSupported, handleInputReport]);

  const disconnect = useCallback(async () => {
    if (deviceRef.current) {
      deviceRef.current.removeEventListener('inputreport', handleInputReport);

      if (deviceRef.current.opened) {
        await deviceRef.current.close();
      }

      deviceRef.current = null;
      setDevice(null);
      setIsConnected(false);
    }
  }, [handleInputReport]);

  const sendReport = useCallback(async (reportId: number, data: number[]) => {
    if (!deviceRef.current || !deviceRef.current.opened) {
      setError('Device not connected');
      return false;
    }

    try {
      setError(null);
      await deviceRef.current.sendReport(reportId, new Uint8Array(data));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send report';
      setError(message);
      return false;
    }
  }, []);

  const sendFeatureReport = useCallback(async (reportId: number, data: number[]) => {
    if (!deviceRef.current || !deviceRef.current.opened) {
      setError('Device not connected');
      return false;
    }

    try {
      setError(null);
      await deviceRef.current.sendFeatureReport(reportId, new Uint8Array(data));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send feature report';
      setError(message);
      return false;
    }
  }, []);

  const receiveFeatureReport = useCallback(async (reportId: number) => {
    if (!deviceRef.current || !deviceRef.current.opened) {
      setError('Device not connected');
      return null;
    }

    try {
      setError(null);
      const data = await deviceRef.current.receiveFeatureReport(reportId);
      return Array.from(new Uint8Array(data.buffer));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to receive feature report';
      setError(message);
      return null;
    }
  }, []);

  const clearReports = useCallback(() => {
    setInputReports([]);
  }, []);

  const getDeviceInfo = useCallback((): HIDDeviceInfo | null => {
    if (!device) return null;

    return {
      vendorId: device.vendorId,
      productId: device.productId,
      productName: device.productName,
      collections: device.collections,
    };
  }, [device]);

  useEffect(() => {
    return () => {
      if (deviceRef.current) {
        deviceRef.current.removeEventListener('inputreport', handleInputReport);
        if (deviceRef.current.opened) {
          deviceRef.current.close();
        }
      }
    };
  }, [handleInputReport]);

  return {
    device,
    isConnected,
    isSupported,
    inputReports,
    error,
    connect,
    disconnect,
    sendReport,
    sendFeatureReport,
    receiveFeatureReport,
    clearReports,
    getDeviceInfo,
  };
}
