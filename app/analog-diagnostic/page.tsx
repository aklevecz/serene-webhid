'use client';

import '@root/global-fonts.css';
import '@root/global.css';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebHID, InputReport } from '@common/useWebHID';
import {
  VIAProtocol,
  VIACommand,
  RAW_HID_BUFFER_SIZE,
  HECommand,
  HEActuationMode,
  HE_CUSTOM_CHANNEL,
  HE_DEFAULTS,
  HE_RANGES,
} from '@common/via';

import Link from 'next/link';

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

const NAV_ITEMS = [
  { href: '/', label: 'Keymap Editor', description: 'Remap keys via VIA protocol' },
  { href: '/hall-effect', label: 'Hall Effect', description: 'Configure HE keyboards' },
  { href: '/analog-diagnostic', label: 'Diagnostics', description: 'Debug HID commands' },
];

interface LogEntry {
  timestamp: number;
  type: 'info' | 'data' | 'error' | 'success';
  source: string;
  message: string;
  data?: number[];
}

interface AnalogReading {
  keyIndex: number;
  value: number;
  timestamp: number;
}

function formatHex(num: number): string {
  return '0x' + num.toString(16).padStart(2, '0').toUpperCase();
}

function formatBytes(data: number[]): string {
  return data.map((b) => formatHex(b)).join(' ');
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

// Analyze report data for patterns that might indicate analog values
function analyzeReport(data: number[]): string {
  const nonZero = data.filter(b => b > 0);
  const unique = Array.from(new Set(nonZero));
  const hasGradient = nonZero.some((v, i, arr) => i > 0 && Math.abs(v - arr[i-1]) < 20 && v !== arr[i-1]);

  const analysis: string[] = [];
  if (nonZero.length === 0) {
    analysis.push('all zeros (idle)');
  } else {
    analysis.push(`${nonZero.length} non-zero bytes`);
    if (unique.length < nonZero.length / 2) {
      analysis.push('repeated values (likely binary)');
    }
    if (hasGradient) {
      analysis.push('gradient detected (likely analog!)');
    }
    const maxVal = Math.max(...nonZero);
    if (maxVal > 200) {
      analysis.push(`peak: ${maxVal}`);
    }
  }
  return analysis.join(', ');
}

export default function AnalogDiagnosticPage() {
  const {
    device,
    isConnected,
    isSupported,
    inputReports,
    error,
    connect,
    disconnect,
    sendReport,
    clearReports,
    getDeviceInfo,
  } = useWebHID();

  const viaRef = useRef<VIAProtocol | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analogReadings, setAnalogReadings] = useState<AnalogReading[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [pollMethod, setPollMethod] = useState<string>('none');
  const [collections, setCollections] = useState<HIDCollectionInfo[]>([]);
  const [customChannelId, setCustomChannelId] = useState(0);
  const [customValueId, setCustomValueId] = useState(0);
  const [liveAnalogData, setLiveAnalogData] = useState<number[]>([]);
  const [heConfig, setHeConfig] = useState<{
    actuationMode: HEActuationMode;
    actuationThreshold: number;
    releaseThreshold: number;
    deadzone: number;
    engageDistance: number;
    disengageDistance: number;
  } | null>(null);

  const deviceInfo = getDeviceInfo();

  const addLog = useCallback((type: LogEntry['type'], source: string, message: string, data?: number[]) => {
    const entry = {
      timestamp: Date.now(),
      type,
      source,
      message,
      data,
    };

    // Console log for easy copy/paste
    const prefix = { info: 'INFO', data: 'DATA', error: 'ERROR', success: 'OK' }[type];
    if (data && data.length > 0) {
      console.log(`[${prefix}] [${source}] ${message}`, data);
    } else {
      console.log(`[${prefix}] [${source}] ${message}`);
    }

    setLogs(prev => [entry, ...prev].slice(0, 500));
  }, []);

  // Method 1: Connect via VIA interface
  const connectVIA = async () => {
    addLog('info', 'CONNECT', 'Attempting VIA connection (usagePage: 0xFF60, usage: 0x61)');
    const connectedDevice = await connect([
      { usagePage: 0xff60, usage: 0x61 },
    ]);

    if (connectedDevice) {
      setCollections([...connectedDevice.collections]);
      addLog('success', 'CONNECT', `Connected: ${connectedDevice.productName}`);
      addLog('info', 'DEVICE', `Collections: ${connectedDevice.collections.length}`);

      connectedDevice.collections.forEach((col, i) => {
        addLog('info', 'COLLECTION', `[${i}] usagePage: ${formatHex(col.usagePage || 0)}, usage: ${formatHex(col.usage || 0)}, reports: ${col.inputReports?.length || 0} in, ${col.outputReports?.length || 0} out`);
      });

      const via = new VIAProtocol();
      await via.connect(connectedDevice);
      viaRef.current = via;

      try {
        const version = await via.getProtocolVersion();
        addLog('success', 'VIA', `Protocol version: ${version}`);
      } catch (err) {
        addLog('error', 'VIA', `Failed to get protocol version: ${err}`);
      }
    }
  };

  // Method 2: Connect with no filter (see all devices)
  const connectAny = async () => {
    addLog('info', 'CONNECT', 'Attempting connection with no filter (will show all HID devices)');
    const connectedDevice = await connect([]);

    if (connectedDevice) {
      setCollections([...connectedDevice.collections]);
      addLog('success', 'CONNECT', `Connected: ${connectedDevice.productName}`);
      addLog('info', 'DEVICE', `VID: ${formatHex(connectedDevice.vendorId)}, PID: ${formatHex(connectedDevice.productId)}`);
      addLog('info', 'DEVICE', `Collections: ${connectedDevice.collections.length}`);

      connectedDevice.collections.forEach((col, i) => {
        addLog('info', 'COLLECTION', `[${i}] usagePage: ${formatHex(col.usagePage || 0)}, usage: ${formatHex(col.usage || 0)}`);
        col.inputReports?.forEach((r, j) => {
          addLog('info', 'INPUT_REPORT', `  Report ${j}: ID=${r.reportId}, items=${r.items?.length || 0}`);
        });
      });
    }
  };

  // Method 3: Connect with vendor-specific filter
  const connectVendor = async () => {
    addLog('info', 'CONNECT', 'Attempting vendor-specific connection (usagePage: 0xFF00)');
    const connectedDevice = await connect([
      { usagePage: 0xff00 },
    ]);

    if (connectedDevice) {
      setCollections([...connectedDevice.collections]);
      addLog('success', 'CONNECT', `Connected: ${connectedDevice.productName}`);
    }
  };

  const handleDisconnect = async () => {
    setIsPolling(false);
    if (viaRef.current) {
      viaRef.current.disconnect();
      viaRef.current = null;
    }
    await disconnect();
    addLog('info', 'DISCONNECT', 'Disconnected');
  };

  // Test VIA CUSTOM_GET_VALUE with various parameters
  const testCustomCommand = async (channelId: number, valueId: number) => {
    if (!device || !device.opened) {
      addLog('error', 'CUSTOM', 'Device not connected');
      return;
    }

    addLog('info', 'CUSTOM', `Testing CUSTOM_GET_VALUE channel=${channelId}, value=${valueId}`);

    const buffer = new Uint8Array(RAW_HID_BUFFER_SIZE);
    buffer[0] = VIACommand.CUSTOM_GET_VALUE;
    buffer[1] = channelId;
    buffer[2] = valueId;

    try {
      await device.sendReport(0, buffer);
      addLog('success', 'CUSTOM', `Sent command, check input reports for response`);
    } catch (err) {
      addLog('error', 'CUSTOM', `Failed: ${err}`);
    }
  };

  // Scan multiple custom channels/values
  const scanCustomCommands = async () => {
    addLog('info', 'SCAN', 'Scanning CUSTOM_GET_VALUE channels 0-3, values 0-5...');

    for (let channel = 0; channel <= 3; channel++) {
      for (let value = 0; value <= 5; value++) {
        await testCustomCommand(channel, value);
        await new Promise(r => setTimeout(r, 100));
      }
    }

    addLog('success', 'SCAN', 'Scan complete - check logs for responses');
  };

  // Test GET_KEYBOARD_VALUE with different subcommands
  const testKeyboardValue = async (subCommand: number) => {
    if (!device || !device.opened) {
      addLog('error', 'KB_VALUE', 'Device not connected');
      return;
    }

    addLog('info', 'KB_VALUE', `Testing GET_KEYBOARD_VALUE subcommand=${formatHex(subCommand)}`);

    const buffer = new Uint8Array(RAW_HID_BUFFER_SIZE);
    buffer[0] = VIACommand.GET_KEYBOARD_VALUE;
    buffer[1] = subCommand;

    try {
      await device.sendReport(0, buffer);
      addLog('success', 'KB_VALUE', `Sent command`);
    } catch (err) {
      addLog('error', 'KB_VALUE', `Failed: ${err}`);
    }
  };

  // Scan keyboard values
  const scanKeyboardValues = async () => {
    addLog('info', 'SCAN', 'Scanning GET_KEYBOARD_VALUE subcommands 0x00-0x10...');

    for (let sub = 0; sub <= 0x10; sub++) {
      await testKeyboardValue(sub);
      await new Promise(r => setTimeout(r, 100));
    }

    addLog('success', 'SCAN', 'Scan complete');
  };

  // Send raw command
  const sendRawCommand = async (commandByte: number, data: number[] = []) => {
    if (!device || !device.opened) {
      addLog('error', 'RAW', 'Device not connected');
      return;
    }

    const buffer = new Uint8Array(RAW_HID_BUFFER_SIZE);
    buffer[0] = commandByte;
    data.forEach((b, i) => buffer[i + 1] = b);

    addLog('info', 'RAW', `Sending command ${formatHex(commandByte)} with ${data.length} bytes`);

    try {
      await device.sendReport(0, buffer);
      addLog('success', 'RAW', 'Sent');
    } catch (err) {
      addLog('error', 'RAW', `Failed: ${err}`);
    }
  };

  // =========================================================================
  // Hall Effect Specific Commands
  // =========================================================================

  const HE_COMMAND_NAMES: Record<number, string> = {
    [HECommand.ACTUATION_THRESHOLD]: 'Actuation Threshold',
    [HECommand.RELEASE_THRESHOLD]: 'Release Threshold',
    [HECommand.START_CALIBRATION]: 'Start Calibration',
    [HECommand.SAVE_CALIBRATION]: 'Save Calibration',
    [HECommand.TOGGLE_ACTUATION_MODE]: 'Actuation Mode',
    [HECommand.RAPID_TRIGGER_DEADZONE]: 'RT Deadzone',
    [HECommand.RAPID_TRIGGER_ENGAGE_DISTANCE]: 'RT Engage Distance',
    [HECommand.RAPID_TRIGGER_DISENGAGE_DISTANCE]: 'RT Disengage Distance',
    [HECommand.KEYCANCEL_AD_MODE]: 'Key Cancel A+D',
    [HECommand.KEYCANCEL_ZX_MODE]: 'Key Cancel Z+X',
  };

  const ACTUATION_MODE_NAMES: Record<number, string> = {
    [HEActuationMode.NORMAL]: 'Normal',
    [HEActuationMode.RAPID_TRIGGER]: 'Rapid Trigger',
    [HEActuationMode.KEY_CANCEL]: 'Key Cancel',
  };

  // Test a specific HE command (GET)
  const testHECommand = async (command: HECommand) => {
    if (!device || !device.opened) {
      addLog('error', 'HE', 'Device not connected');
      return;
    }

    const commandName = HE_COMMAND_NAMES[command] || `Unknown (${command})`;
    addLog('info', 'HE', `Getting ${commandName} (channel=${HE_CUSTOM_CHANNEL}, cmd=${command})`);

    const buffer = new Uint8Array(RAW_HID_BUFFER_SIZE);
    buffer[0] = VIACommand.CUSTOM_GET_VALUE;
    buffer[1] = HE_CUSTOM_CHANNEL;
    buffer[2] = command;

    try {
      await device.sendReport(0, buffer);
      addLog('success', 'HE', `Sent GET for ${commandName}`);
    } catch (err) {
      addLog('error', 'HE', `Failed: ${err}`);
    }
  };

  // Set a specific HE value
  const setHEValue = async (command: HECommand, value: number) => {
    if (!device || !device.opened) {
      addLog('error', 'HE', 'Device not connected');
      return;
    }

    const commandName = HE_COMMAND_NAMES[command] || `Unknown (${command})`;
    addLog('info', 'HE', `Setting ${commandName} to ${value}`);

    const buffer = new Uint8Array(RAW_HID_BUFFER_SIZE);
    buffer[0] = VIACommand.CUSTOM_SET_VALUE;
    buffer[1] = HE_CUSTOM_CHANNEL;
    buffer[2] = command;
    buffer[3] = value;

    try {
      await device.sendReport(0, buffer);
      addLog('success', 'HE', `Sent SET ${commandName} = ${value}`);
    } catch (err) {
      addLog('error', 'HE', `Failed: ${err}`);
    }
  };

  // Scan all HE commands
  const scanHECommands = async () => {
    addLog('info', 'HE_SCAN', 'Scanning all Hall Effect configuration values...');

    const commands = [
      HECommand.ACTUATION_THRESHOLD,
      HECommand.RELEASE_THRESHOLD,
      HECommand.TOGGLE_ACTUATION_MODE,
      HECommand.RAPID_TRIGGER_DEADZONE,
      HECommand.RAPID_TRIGGER_ENGAGE_DISTANCE,
      HECommand.RAPID_TRIGGER_DISENGAGE_DISTANCE,
      HECommand.KEYCANCEL_AD_MODE,
      HECommand.KEYCANCEL_ZX_MODE,
    ];

    for (const cmd of commands) {
      await testHECommand(cmd);
      await new Promise(r => setTimeout(r, 150));
    }

    addLog('success', 'HE_SCAN', 'Scan complete - check logs for values');
  };

  // Load full HE config using VIA protocol class
  const loadHEConfig = async () => {
    if (!viaRef.current) {
      addLog('error', 'HE', 'VIA not connected');
      return;
    }

    addLog('info', 'HE', 'Loading full HE configuration via VIA protocol...');

    try {
      const config = await viaRef.current.getHEConfig();
      setHeConfig({
        actuationMode: config.actuationMode,
        actuationThreshold: config.actuationThreshold,
        releaseThreshold: config.releaseThreshold,
        deadzone: config.rapidTrigger.deadzone,
        engageDistance: config.rapidTrigger.engageDistance,
        disengageDistance: config.rapidTrigger.disengageDistance,
      });

      addLog('success', 'HE', `Loaded config: Mode=${ACTUATION_MODE_NAMES[config.actuationMode]}, Act=${config.actuationThreshold}, Rel=${config.releaseThreshold}`);
      addLog('info', 'HE', `Rapid Trigger: DZ=${config.rapidTrigger.deadzone}, Eng=${config.rapidTrigger.engageDistance}, Dis=${config.rapidTrigger.disengageDistance}`);
      addLog('info', 'HE', `Key Cancel: A+D=${config.keyCancel.adMode}, Z+X=${config.keyCancel.zxMode}`);
    } catch (err) {
      addLog('error', 'HE', `Failed to load config: ${err}`);
    }
  };

  // Start HE calibration
  const startHECalibration = async () => {
    if (!viaRef.current) {
      addLog('error', 'HE', 'VIA not connected');
      return;
    }

    addLog('info', 'HE_CAL', 'Starting Hall Effect calibration...');
    addLog('info', 'HE_CAL', 'Press all keys fully to calibrate noise ceiling');

    try {
      await viaRef.current.startHECalibration();
      addLog('success', 'HE_CAL', 'Calibration started - press keys now');
    } catch (err) {
      addLog('error', 'HE_CAL', `Failed: ${err}`);
    }
  };

  // Save HE calibration
  const saveHECalibration = async () => {
    if (!viaRef.current) {
      addLog('error', 'HE', 'VIA not connected');
      return;
    }

    addLog('info', 'HE_CAL', 'Saving calibration to EEPROM...');

    try {
      await viaRef.current.saveHECalibration();
      addLog('success', 'HE_CAL', 'Calibration saved');
    } catch (err) {
      addLog('error', 'HE_CAL', `Failed: ${err}`);
    }
  };

  // Log input reports with analysis
  useEffect(() => {
    if (inputReports.length > 0) {
      const latest = inputReports[0];
      const analysis = analyzeReport(latest.data);
      addLog('data', 'INPUT', `ID:${latest.reportId} ${formatBytes(latest.data.slice(0, 16))}${latest.data.length > 16 ? '...' : ''} | ${analysis}`, latest.data);

      // Check if this looks like analog data (values between 0-255 that aren't all the same)
      const nonZero = latest.data.filter(b => b > 0 && b < 255);
      if (nonZero.length > 0) {
        const unique = Array.from(new Set(nonZero));
        if (unique.length > 1) {
          setLiveAnalogData(latest.data);
        }
      }
    }
  }, [inputReports, addLog]);

  // Continuous polling for matrix state or analog data
  useEffect(() => {
    if (!isPolling || !viaRef.current) return;

    let cancelled = false;
    const interval = 30; // ~33Hz

    const poll = async () => {
      if (cancelled || !viaRef.current) return;

      try {
        if (pollMethod === 'matrix') {
          const pressed = await viaRef.current.getMatrixState();
          if (pressed.size > 0) {
            addLog('data', 'MATRIX', `Pressed: ${Array.from(pressed).join(', ')}`);
          }
        }
      } catch (err) {
        // Silently continue
      }

      if (!cancelled) {
        setTimeout(poll, interval);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [isPolling, pollMethod, addLog]);

  const clearLogs = () => setLogs([]);

  const copyLogs = () => {
    const text = logs.map(log => {
      const time = formatTime(log.timestamp);
      const dataStr = log.data ? ` | RAW: [${log.data.join(', ')}]` : '';
      return `[${time}] [${log.type.toUpperCase()}] [${log.source}] ${log.message}${dataStr}`;
    }).reverse().join('\n');

    navigator.clipboard.writeText(text);
    addLog('success', 'COPY', `Copied ${logs.length} log entries to clipboard`);
  };

  const copyInputReports = () => {
    const text = inputReports.map(r => {
      const time = formatTime(r.timestamp);
      return `[${time}] ID:${r.reportId} [${r.data.join(', ')}]`;
    }).join('\n');

    navigator.clipboard.writeText(text);
    addLog('success', 'COPY', `Copied ${inputReports.length} input reports to clipboard`);
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
          ANALOG DIAGNOSTIC TOOL <Badge>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</Badge>
        </Row>
        <Row>Test different methods to get live actuation data from Serene keyboard</Row>
        <br />
        <Card title="NAVIGATION">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <Button theme={item.href === '/analog-diagnostic' ? 'PRIMARY' : 'SECONDARY'}>
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </Grid>

      <Grid>
        {error && <AlertBanner>{error}</AlertBanner>}

        <Card title="1. CONNECTION METHODS">
          <Row>Try different connection filters to find analog interface:</Row>
          <br />
          {!isConnected ? (
            <ButtonGroup
              items={[
                { body: 'VIA (0xFF60)', onClick: connectVIA, selected: false },
                { body: 'Vendor (0xFF00)', onClick: connectVendor, selected: false },
                { body: 'Any Device', onClick: connectAny, selected: false },
              ]}
            />
          ) : (
            <Button theme="SECONDARY" onClick={handleDisconnect}>Disconnect</Button>
          )}

          {deviceInfo && (
            <>
              <br />
              <CodeBlock>
{`Device: ${deviceInfo.productName}
VID: ${formatHex(deviceInfo.vendorId)} | PID: ${formatHex(deviceInfo.productId)}
Collections: ${collections.length}
${collections.map((c, i) => `  [${i}] Page: ${formatHex(c.usagePage || 0)} Usage: ${formatHex(c.usage || 0)}`).join('\n')}`}
              </CodeBlock>
            </>
          )}
        </Card>

        {isConnected && (
          <>
            <Card title="2. TEST VIA CUSTOM COMMANDS">
              <Row>Send CUSTOM_GET_VALUE (0x08) to request analog data:</Row>
              <br />
              <RowSpaceBetween>
                <span>Channel: {customChannelId} | Value: {customValueId}</span>
                <ButtonGroup
                  items={[
                    { body: 'Ch-', onClick: () => setCustomChannelId(Math.max(0, customChannelId - 1)), selected: false },
                    { body: 'Ch+', onClick: () => setCustomChannelId(customChannelId + 1), selected: false },
                    { body: 'Val-', onClick: () => setCustomValueId(Math.max(0, customValueId - 1)), selected: false },
                    { body: 'Val+', onClick: () => setCustomValueId(customValueId + 1), selected: false },
                  ]}
                />
              </RowSpaceBetween>
              <br />
              <ButtonGroup
                items={[
                  { body: 'Send Custom Cmd', onClick: () => testCustomCommand(customChannelId, customValueId), selected: false },
                  { body: 'Scan All (0-3, 0-5)', onClick: scanCustomCommands, selected: false },
                ]}
              />
            </Card>

            <Card title="3. TEST KEYBOARD VALUES">
              <Row>Send GET_KEYBOARD_VALUE (0x02) with different subcommands:</Row>
              <br />
              <ButtonGroup
                items={[
                  { body: 'Matrix State (0x03)', onClick: () => testKeyboardValue(0x03), selected: false },
                  { body: 'Scan 0x00-0x10', onClick: scanKeyboardValues, selected: false },
                ]}
              />
            </Card>

            <Card title="4. HALL EFFECT COMMANDS">
              <Row>Test Hall Effect specific VIA commands (Cleaver HE firmware):</Row>
              <br />
              <ButtonGroup
                items={[
                  { body: 'Load HE Config', onClick: loadHEConfig, selected: false },
                  { body: 'Scan All HE Values', onClick: scanHECommands, selected: false },
                ]}
              />
              <br />
              <Row>Individual HE Commands:</Row>
              <br />
              <ButtonGroup
                items={[
                  { body: 'Actuation', onClick: () => testHECommand(HECommand.ACTUATION_THRESHOLD), selected: false },
                  { body: 'Release', onClick: () => testHECommand(HECommand.RELEASE_THRESHOLD), selected: false },
                  { body: 'Mode', onClick: () => testHECommand(HECommand.TOGGLE_ACTUATION_MODE), selected: false },
                  { body: 'RT Deadzone', onClick: () => testHECommand(HECommand.RAPID_TRIGGER_DEADZONE), selected: false },
                ]}
              />
              <br />
              <ButtonGroup
                items={[
                  { body: 'RT Engage', onClick: () => testHECommand(HECommand.RAPID_TRIGGER_ENGAGE_DISTANCE), selected: false },
                  { body: 'RT Disengage', onClick: () => testHECommand(HECommand.RAPID_TRIGGER_DISENGAGE_DISTANCE), selected: false },
                  { body: 'KC A+D', onClick: () => testHECommand(HECommand.KEYCANCEL_AD_MODE), selected: false },
                  { body: 'KC Z+X', onClick: () => testHECommand(HECommand.KEYCANCEL_ZX_MODE), selected: false },
                ]}
              />
              {heConfig && (
                <>
                  <br />
                  <CodeBlock>
{`Current HE Config:
  Mode: ${ACTUATION_MODE_NAMES[heConfig.actuationMode]}
  Actuation: ${heConfig.actuationThreshold}
  Release: ${heConfig.releaseThreshold}
  RT Deadzone: ${heConfig.deadzone}
  RT Engage: ${heConfig.engageDistance}
  RT Disengage: ${heConfig.disengageDistance}`}
                  </CodeBlock>
                </>
              )}
            </Card>

            <Card title="5. HE CALIBRATION">
              <Row>Calibrate Hall Effect sensors:</Row>
              <br />
              <ButtonGroup
                items={[
                  { body: 'Start Calibration', onClick: startHECalibration, selected: false },
                  { body: 'Save Calibration', onClick: saveHECalibration, selected: false },
                ]}
              />
              <br />
              <CodeBlock>
{`Calibration Process:
1. Click "Start Calibration"
2. Press each key fully to its bottom
3. Release all keys
4. Click "Save Calibration" to persist to EEPROM`}
              </CodeBlock>
            </Card>

            <Card title="6. RAW COMMAND TEST">
              <Row>Send custom raw commands:</Row>
              <br />
              <ButtonGroup
                items={[
                  { body: '0x20 (custom?)', onClick: () => sendRawCommand(0x20), selected: false },
                  { body: '0x21 (analog?)', onClick: () => sendRawCommand(0x21), selected: false },
                  { body: '0x22', onClick: () => sendRawCommand(0x22), selected: false },
                  { body: '0x30', onClick: () => sendRawCommand(0x30), selected: false },
                ]}
              />
            </Card>

            <Card title="7. CONTINUOUS POLLING">
              <Row>Poll for data continuously:</Row>
              <br />
              <ButtonGroup
                items={[
                  {
                    body: isPolling ? 'Stop Polling' : 'Poll Matrix State',
                    onClick: () => { setPollMethod('matrix'); setIsPolling(!isPolling); },
                    selected: isPolling && pollMethod === 'matrix'
                  },
                ]}
              />
            </Card>

            {liveAnalogData.length > 0 && (
              <Card title="POTENTIAL ANALOG DATA DETECTED">
                <Row>Last reading with varying values:</Row>
                <br />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', fontFamily: 'monospace', fontSize: '10px' }}>
                  {liveAnalogData.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: `rgb(${val}, ${255-val}, 100)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: val > 128 ? 'black' : 'white',
                      }}
                    >
                      {val > 0 ? val : ''}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        <CardDouble title="LOG OUTPUT">
          <RowSpaceBetween>
            <span>{logs.length} entries</span>
            <ButtonGroup
              items={[
                { body: 'Copy All', onClick: copyLogs, selected: false },
                { body: 'Clear', onClick: clearLogs, selected: false },
              ]}
            />
          </RowSpaceBetween>
          <br />
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <CodeBlock>
              {logs.length === 0
                ? 'Connect a device to begin diagnostics...'
                : logs.map((log, i) => {
                    const time = formatTime(log.timestamp);
                    const prefix = {
                      'info': '   ',
                      'data': '>> ',
                      'error': '!! ',
                      'success': 'OK ',
                    }[log.type];
                    return `${prefix}[${time}] [${log.source}] ${log.message}`;
                  }).join('\n')
              }
            </CodeBlock>
          </div>
        </CardDouble>

        <Card title="RAW INPUT REPORTS">
          <RowSpaceBetween>
            <span>Last {Math.min(inputReports.length, 10)} reports (total: {inputReports.length})</span>
            <ButtonGroup
              items={[
                { body: 'Copy All', onClick: copyInputReports, selected: false },
                { body: 'Clear', onClick: clearReports, selected: false },
              ]}
            />
          </RowSpaceBetween>
          <br />
          <CodeBlock>
            {inputReports.length === 0
              ? 'No reports yet. Press keys or send commands...'
              : inputReports.slice(0, 10).map((r, i) => {
                  const time = formatTime(r.timestamp);
                  return `[${time}] ID:${r.reportId} ${formatBytes(r.data)}`;
                }).join('\n')
            }
          </CodeBlock>
        </Card>
      </Grid>
    </>
  );
}
