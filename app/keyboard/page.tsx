'use client';

import '@root/global-fonts.css';
import '@root/global.css';

import { useState, useEffect, useRef } from 'react';
import { useWebHID, InputReport } from '@common/useWebHID';
import { VIAProtocol, getKeyLabel } from '@common/via';

import Badge from '@components/Badge';
import Button from '@components/Button';
import Card from '@components/Card';
import CardDouble from '@components/CardDouble';
import CodeBlock from '@components/CodeBlock';
import Grid from '@components/Grid';
import Row from '@components/Row';
import RowSpaceBetween from '@components/RowSpaceBetween';
import ActionButton from '@components/ActionButton';
import AlertBanner from '@components/AlertBanner';
import ButtonGroup from '@components/ButtonGroup';
import KeyboardLayout, { KeyDefinition, LAYOUT_60_ANSI } from '@components/KeyboardLayout';
import KeyPicker from '@components/KeyPicker';
import Accordion from '@components/Accordion';

function formatHex(num: number): string {
  return '0x' + num.toString(16).padStart(2, '0').toUpperCase();
}

function formatBytes(data: number[]): string {
  return data.map((b) => formatHex(b)).join(' ');
}

export default function KeyboardPage() {
  const {
    device,
    isConnected,
    isSupported,
    inputReports,
    error,
    connect,
    disconnect,
    clearReports,
    getDeviceInfo,
  } = useWebHID();

  const viaRef = useRef<VIAProtocol | null>(null);
  const [viaConnected, setViaConnected] = useState(false);
  const [protocolVersion, setProtocolVersion] = useState<number | null>(null);
  const [layerCount, setLayerCount] = useState(4);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [keymap, setKeymap] = useState<Map<string, number>>(new Map());
  const [selectedKey, setSelectedKey] = useState<KeyDefinition | null>(null);
  const [viaError, setViaError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const deviceInfo = getDeviceInfo();

  const handleConnect = async () => {
    const connectedDevice = await connect([
      { usagePage: 0xff60, usage: 0x61 }, // QMK Raw HID / VIA
    ]);

    if (connectedDevice) {
      const via = new VIAProtocol();
      await via.connect(connectedDevice);
      viaRef.current = via;

      try {
        const version = await via.getProtocolVersion();
        setProtocolVersion(version);

        const layers = await via.getLayerCount();
        setLayerCount(layers);

        setViaConnected(true);
        setViaError(null);

        // Load initial keymap for layer 0
        await loadKeymap(via, 0);
      } catch (err) {
        setViaError(err instanceof Error ? err.message : 'Failed to initialize VIA');
        setViaConnected(false);
      }
    }
  };

  const loadKeymap = async (via: VIAProtocol, layer: number) => {
    const newKeymap = new Map<string, number>();

    // Load keycodes for all keys in the layout
    for (const key of LAYOUT_60_ANSI) {
      try {
        const keycode = await via.getKeycode(layer, key.row, key.col);
        newKeymap.set(`${key.row},${key.col}`, keycode);
      } catch {
        // Key might not exist in this keyboard's matrix
      }
    }

    setKeymap(newKeymap);
  };

  const handleDisconnect = async () => {
    if (viaRef.current) {
      viaRef.current.disconnect();
      viaRef.current = null;
    }
    setViaConnected(false);
    setProtocolVersion(null);
    setKeymap(new Map());
    setSelectedKey(null);
    await disconnect();
  };

  const handleLayerChange = async (layer: number) => {
    setCurrentLayer(layer);
    setSelectedKey(null);
    if (viaRef.current && viaConnected) {
      await loadKeymap(viaRef.current, layer);
    }
  };

  const handleKeySelect = (key: KeyDefinition) => {
    setSelectedKey(key);
  };

  const handleKeycodeSelect = async (keycode: number) => {
    if (!selectedKey || !viaRef.current || !viaConnected) return;

    try {
      await viaRef.current.setKeycode(currentLayer, selectedKey.row, selectedKey.col, keycode);

      // Update local keymap
      setKeymap((prev) => {
        const newMap = new Map(prev);
        newMap.set(`${selectedKey.row},${selectedKey.col}`, keycode);
        return newMap;
      });

      setSaveStatus('Key saved!');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setViaError(err instanceof Error ? err.message : 'Failed to set keycode');
    }
  };

  const handleResetKeymap = async () => {
    if (!viaRef.current || !viaConnected) return;

    if (!confirm('Reset all layers to default? This cannot be undone.')) return;

    try {
      await viaRef.current.resetKeymap();
      await loadKeymap(viaRef.current, currentLayer);
      setSaveStatus('Keymap reset to default');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setViaError(err instanceof Error ? err.message : 'Failed to reset keymap');
    }
  };

  if (!isSupported) {
    return (
      <Grid>
        <br />
        <AlertBanner>WebHID is not supported in this browser. Please use Chrome, Edge, or Opera.</AlertBanner>
      </Grid>
    );
  }

  return (
    <>
      <br />
      <Grid>
        <Row>
          KEYBOARD CONFIGURATOR <Badge>{isConnected ? (viaConnected ? 'VIA CONNECTED' : 'CONNECTED') : 'DISCONNECTED'}</Badge>
        </Row>
        <Row>WebHID key remapping for QMK/VIA keyboards</Row>
      </Grid>

      <Grid>
        {error && <AlertBanner>{error}</AlertBanner>}
        {viaError && <AlertBanner>{viaError}</AlertBanner>}
        {saveStatus && <AlertBanner>{saveStatus}</AlertBanner>}

        <Card title="CONNECTION">
          <RowSpaceBetween>
            {!isConnected ? (
              <Button onClick={handleConnect}>Connect Keyboard</Button>
            ) : (
              <Button theme="SECONDARY" onClick={handleDisconnect}>Disconnect</Button>
            )}
          </RowSpaceBetween>

          {deviceInfo && (
            <>
              <br />
              <CodeBlock>
{`Device: ${deviceInfo.productName}
Vendor ID: ${formatHex(deviceInfo.vendorId)}
Product ID: ${formatHex(deviceInfo.productId)}
VIA Protocol: ${protocolVersion !== null ? `v${protocolVersion}` : 'N/A'}
Layers: ${layerCount}`}
              </CodeBlock>
            </>
          )}
        </Card>

        {viaConnected && (
          <>
            <Card title="LAYER SELECT">
              <ButtonGroup
                items={Array.from({ length: layerCount }, (_, i) => ({
                  body: `Layer ${i}`,
                  selected: currentLayer === i,
                  onClick: () => handleLayerChange(i),
                }))}
              />
            </Card>

            <CardDouble title="KEYMAP">
              <KeyboardLayout
                layout={LAYOUT_60_ANSI}
                keymap={keymap}
                selectedKey={selectedKey}
                onKeySelect={handleKeySelect}
                layer={currentLayer}
              />
              <br />
              <RowSpaceBetween>
                <span>
                  {selectedKey
                    ? `Selected: Row ${selectedKey.row}, Col ${selectedKey.col} = ${getKeyLabel(keymap.get(`${selectedKey.row},${selectedKey.col}`) || 0)}`
                    : 'Click a key to remap it'}
                </span>
                <ActionButton onClick={handleResetKeymap}>Reset Keymap</ActionButton>
              </RowSpaceBetween>
            </CardDouble>

            {selectedKey && (
              <Card title="ASSIGN KEY">
                <Row>Select a new keycode for Row {selectedKey.row}, Col {selectedKey.col}:</Row>
                <br />
                <KeyPicker
                  selectedKeycode={keymap.get(`${selectedKey.row},${selectedKey.col}`)}
                  onSelect={handleKeycodeSelect}
                />
              </Card>
            )}
          </>
        )}

        <Accordion defaultValue={false} title="RAW HID MONITOR">
          <Card title="INPUT REPORTS">
            <RowSpaceBetween>
              <span>Received: {inputReports.length}</span>
              <ActionButton onClick={clearReports}>Clear</ActionButton>
            </RowSpaceBetween>
            <br />
            {inputReports.length === 0 ? (
              <Row>No reports received yet.</Row>
            ) : (
              <CodeBlock>
                {inputReports
                  .slice(0, 20)
                  .map((report: InputReport, i: number) => {
                    const time = new Date(report.timestamp).toLocaleTimeString();
                    return `[${time}] ID:${report.reportId} ${formatBytes(report.data)}`;
                  })
                  .join('\n')}
              </CodeBlock>
            )}
          </Card>
        </Accordion>
      </Grid>
    </>
  );
}
