'use client';

import '@root/global-fonts.css';
import '@root/global.css';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebHID } from '@common/useWebHID';
import {
  VIAProtocol,
  HEActuationMode,
  HEConfig,
  HE_DEFAULTS,
  HE_RANGES,
  RGBEffect,
  RGBConfig,
} from '@common/via';
import Link from 'next/link';

import Badge from '@components/Badge';
import Button from '@components/Button';
import Card from '@components/Card';
import CardDouble from '@components/CardDouble';
import Grid from '@components/Grid';
import Row from '@components/Row';
import RowSpaceBetween from '@components/RowSpaceBetween';
import ButtonGroup from '@components/ButtonGroup';
import AlertBanner from '@components/AlertBanner';
import CodeBlock from '@components/CodeBlock';
import Checkbox from '@components/Checkbox';
import Select from '@components/Select';
import Input from '@components/Input';
import BarProgress from '@components/BarProgress';
import Divider from '@components/Divider';
import NumberRangeSlider from '@components/NumberRangeSlider';

const NAV_ITEMS = [
  { href: '/', label: 'Keymap Editor', description: 'Remap keys via VIA protocol' },
  { href: '/hall-effect', label: 'Hall Effect', description: 'Configure HE keyboards' },
  { href: '/analog-diagnostic', label: 'Diagnostics', description: 'Debug HID commands' },
];

const ACTUATION_MODE_LABELS: Record<HEActuationMode, string> = {
  [HEActuationMode.NORMAL]: 'Normal',
  [HEActuationMode.RAPID_TRIGGER]: 'Rapid Trigger',
  [HEActuationMode.KEY_CANCEL]: 'Key Cancel',
};

const ACTUATION_MODE_DESCRIPTIONS: Record<HEActuationMode, string> = {
  [HEActuationMode.NORMAL]: 'Standard actuation with fixed thresholds',
  [HEActuationMode.RAPID_TRIGGER]: 'Dynamic boundaries for fast repeated presses',
  [HEActuationMode.KEY_CANCEL]: 'SOCD cleaning for competitive gaming (A+D / Z+X cancellation)',
};

// RGB Effect names for Select dropdown
const RGB_EFFECT_OPTIONS = [
  'Off',
  'Solid Color',
  'Breathing',
  'Band Spiral',
  'Cycle All',
  'Cycle Left Right',
  'Cycle Up Down',
  'Rainbow Chevron',
  'Cycle Out In',
  'Cycle Out In Dual',
  'Cycle Pinwheel',
  'Cycle Spiral',
  'Dual Beacon',
  'Rainbow Beacon',
  'Rainbow Pinwheels',
  'Raindrops',
  'Jellybean Raindrops',
  'Hue Breathing',
  'Hue Pendulum',
  'Hue Wave',
  'Typing Heatmap',
  'Digital Rain',
  'Reactive Simple',
  'Reactive',
  'Reactive Wide',
  'Reactive Multiwide',
  'Reactive Cross',
  'Reactive Multicross',
  'Reactive Nexus',
  'Reactive Multinexus',
  'Splash',
  'Multisplash',
  'Solid Splash',
  'Solid Multisplash',
];


export default function HallEffectPage() {
  const {
    device,
    isConnected,
    isSupported,
    error,
    connect,
    disconnect,
  } = useWebHID();

  const viaRef = useRef<VIAProtocol | null>(null);
  const [config, setConfig] = useState<HEConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local state for editing (before saving)
  const [localActuationThreshold, setLocalActuationThreshold] = useState<number>(HE_DEFAULTS.ACTUATION_THRESHOLD);
  const [localReleaseThreshold, setLocalReleaseThreshold] = useState<number>(HE_DEFAULTS.RELEASE_THRESHOLD);
  const [localActuationMode, setLocalActuationMode] = useState<HEActuationMode>(HEActuationMode.NORMAL);
  const [localDeadzone, setLocalDeadzone] = useState<number>(HE_DEFAULTS.RAPID_TRIGGER_DEADZONE);
  const [localEngageDistance, setLocalEngageDistance] = useState<number>(HE_DEFAULTS.RAPID_TRIGGER_ENGAGE);
  const [localDisengageDistance, setLocalDisengageDistance] = useState<number>(HE_DEFAULTS.RAPID_TRIGGER_DISENGAGE);
  const [localADMode, setLocalADMode] = useState(false);
  const [localZXMode, setLocalZXMode] = useState(false);

  // RGB State
  const [rgbBrightness, setRgbBrightness] = useState(128);
  const [rgbEffect, setRgbEffect] = useState<RGBEffect>(RGBEffect.SOLID_COLOR);
  const [rgbHue, setRgbHue] = useState(0);
  const [rgbSat, setRgbSat] = useState(255);
  const [rgbSpeed, setRgbSpeed] = useState(128);

  // Debounce timer refs for RGB
  const rgbDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced RGB send function
  const sendRGBDebounced = useCallback((fn: () => Promise<void>) => {
    if (rgbDebounceRef.current) {
      clearTimeout(rgbDebounceRef.current);
    }
    rgbDebounceRef.current = setTimeout(() => {
      fn().catch(console.error);
    }, 50); // 50ms debounce
  }, []);

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    setErrorMessage(null);
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setStatusMessage(null);
  }, []);

  const handleConnect = async () => {
    setErrorMessage(null);
    const connectedDevice = await connect([
      { usagePage: 0xff60, usage: 0x61 },
    ]);

    if (connectedDevice) {
      const via = new VIAProtocol();
      await via.connect(connectedDevice);
      viaRef.current = via;
      showStatus('Connected! Loading configuration...');
      await loadConfig();
    }
  };

  const handleDisconnect = async () => {
    if (viaRef.current) {
      viaRef.current.disconnect();
      viaRef.current = null;
    }
    await disconnect();
    setConfig(null);
    showStatus('Disconnected');
  };

  const loadConfig = async () => {
    if (!viaRef.current) return;

    setIsLoading(true);
    setErrorMessage(null);
    showStatus('Loading HE configuration (this may timeout if not supported)...');

    try {
      // Try to load with a reasonable timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout - keyboard may not support HE commands')), 5000);
      });

      const loadedConfig = await Promise.race([
        viaRef.current.getHEConfig(),
        timeoutPromise,
      ]);

      setConfig(loadedConfig);

      // Update local state
      setLocalActuationThreshold(loadedConfig.actuationThreshold);
      setLocalReleaseThreshold(loadedConfig.releaseThreshold);
      setLocalActuationMode(loadedConfig.actuationMode);
      setLocalDeadzone(loadedConfig.rapidTrigger.deadzone);
      setLocalEngageDistance(loadedConfig.rapidTrigger.engageDistance);
      setLocalDisengageDistance(loadedConfig.rapidTrigger.disengageDistance);
      setLocalADMode(loadedConfig.keyCancel.adMode);
      setLocalZXMode(loadedConfig.keyCancel.zxMode);

      showStatus('Configuration loaded successfully');
    } catch (err) {
      console.error('HE config load error:', err);
      showError(`Failed to load HE configuration: ${err}. The keyboard may not support Hall Effect commands.`);
      // Use defaults so the UI is still usable
      useDefaultConfig();
    } finally {
      setIsLoading(false);
    }
  };

  const useDefaultConfig = () => {
    const defaultConfig: HEConfig = {
      actuationMode: HEActuationMode.NORMAL,
      actuationThreshold: HE_DEFAULTS.ACTUATION_THRESHOLD,
      releaseThreshold: HE_DEFAULTS.RELEASE_THRESHOLD,
      rapidTrigger: {
        deadzone: HE_DEFAULTS.RAPID_TRIGGER_DEADZONE,
        engageDistance: HE_DEFAULTS.RAPID_TRIGGER_ENGAGE,
        disengageDistance: HE_DEFAULTS.RAPID_TRIGGER_DISENGAGE,
      },
      keyCancel: {
        adMode: false,
        zxMode: false,
      },
    };
    setConfig(defaultConfig);
    setLocalActuationThreshold(defaultConfig.actuationThreshold);
    setLocalReleaseThreshold(defaultConfig.releaseThreshold);
    setLocalActuationMode(defaultConfig.actuationMode);
    setLocalDeadzone(defaultConfig.rapidTrigger.deadzone);
    setLocalEngageDistance(defaultConfig.rapidTrigger.engageDistance);
    setLocalDisengageDistance(defaultConfig.rapidTrigger.disengageDistance);
    setLocalADMode(defaultConfig.keyCancel.adMode);
    setLocalZXMode(defaultConfig.keyCancel.zxMode);
  };

  const skipLoadConfig = () => {
    setIsLoading(false);
    useDefaultConfig();
    showStatus('Using default values - changes will be sent to keyboard when saved');
  };

  // RGB Functions
  const loadRGBConfig = async () => {
    if (!viaRef.current) return;

    try {
      const rgb = await viaRef.current.getRGBConfig();
      setRgbBrightness(rgb.brightness);
      setRgbEffect(rgb.effect);
      setRgbHue(rgb.color1.hue);
      setRgbSat(rgb.color1.sat);
      setRgbSpeed(rgb.effectSpeed);
      showStatus('RGB config loaded');
    } catch (err) {
      console.error('RGB load error:', err);
      // Don't show error - RGB might not be supported
    }
  };

  const applyRGB = async () => {
    if (!viaRef.current) return;

    try {
      await viaRef.current.setRGBBrightness(rgbBrightness);
      await viaRef.current.setRGBEffect(rgbEffect);
      await viaRef.current.setRGBColor1(rgbHue, rgbSat);
      await viaRef.current.setRGBEffectSpeed(rgbSpeed);
      showStatus('RGB applied');
    } catch (err) {
      showError(`RGB error: ${err}`);
    }
  };

  const saveRGB = async () => {
    if (!viaRef.current) return;

    try {
      await applyRGB();
      await viaRef.current.saveLighting();
      showStatus('RGB saved to keyboard');
    } catch (err) {
      showError(`RGB save error: ${err}`);
    }
  };

  // Quick RGB presets
  const setRGBPreset = async (preset: 'off' | 'white' | 'red' | 'green' | 'blue' | 'rainbow') => {
    if (!viaRef.current) return;

    try {
      switch (preset) {
        case 'off':
          await viaRef.current.setRGBOff();
          setRgbEffect(RGBEffect.OFF);
          break;
        case 'white':
          await viaRef.current.setRGBSolidColor(0, 0, rgbBrightness);
          setRgbEffect(RGBEffect.SOLID_COLOR);
          setRgbHue(0);
          setRgbSat(0);
          break;
        case 'red':
          await viaRef.current.setRGBSolidColor(0, 255, rgbBrightness);
          setRgbEffect(RGBEffect.SOLID_COLOR);
          setRgbHue(0);
          setRgbSat(255);
          break;
        case 'green':
          await viaRef.current.setRGBSolidColor(85, 255, rgbBrightness);
          setRgbEffect(RGBEffect.SOLID_COLOR);
          setRgbHue(85);
          setRgbSat(255);
          break;
        case 'blue':
          await viaRef.current.setRGBSolidColor(170, 255, rgbBrightness);
          setRgbEffect(RGBEffect.SOLID_COLOR);
          setRgbHue(170);
          setRgbSat(255);
          break;
        case 'rainbow':
          await viaRef.current.setRGBRainbow();
          setRgbEffect(RGBEffect.CYCLE_ALL);
          break;
      }
      showStatus(`RGB: ${preset}`);
    } catch (err) {
      showError(`RGB error: ${err}`);
    }
  };

  const saveConfig = async () => {
    if (!viaRef.current) return;

    // Validate thresholds
    if (localReleaseThreshold >= localActuationThreshold) {
      showError('Release threshold must be lower than actuation threshold');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await viaRef.current.setHEConfig({
        actuationMode: localActuationMode,
        actuationThreshold: localActuationThreshold,
        releaseThreshold: localReleaseThreshold,
        rapidTrigger: {
          deadzone: localDeadzone,
          engageDistance: localEngageDistance,
          disengageDistance: localDisengageDistance,
        },
        keyCancel: {
          adMode: localADMode,
          zxMode: localZXMode,
        },
      });

      // Save to EEPROM
      await viaRef.current.heCustomSave();

      // Reload to confirm
      await loadConfig();
      showStatus('Configuration saved to EEPROM');
    } catch (err) {
      showError(`Failed to save configuration: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const startCalibration = async () => {
    if (!viaRef.current) return;

    setIsCalibrating(true);
    setErrorMessage(null);
    showStatus('Starting calibration... Press all keys fully');

    try {
      await viaRef.current.startHECalibration();
      showStatus('Calibration started - press all keys fully, then click Save Calibration');
    } catch (err) {
      showError(`Calibration failed: ${err}`);
      setIsCalibrating(false);
    }
  };

  const saveCalibration = async () => {
    if (!viaRef.current) return;

    try {
      await viaRef.current.saveHECalibration();
      setIsCalibrating(false);
      showStatus('Calibration saved');
      await loadConfig();
    } catch (err) {
      showError(`Failed to save calibration: ${err}`);
    }
  };

  const resetToDefaults = () => {
    setLocalActuationThreshold(HE_DEFAULTS.ACTUATION_THRESHOLD);
    setLocalReleaseThreshold(HE_DEFAULTS.RELEASE_THRESHOLD);
    setLocalActuationMode(HEActuationMode.NORMAL);
    setLocalDeadzone(HE_DEFAULTS.RAPID_TRIGGER_DEADZONE);
    setLocalEngageDistance(HE_DEFAULTS.RAPID_TRIGGER_ENGAGE);
    setLocalDisengageDistance(HE_DEFAULTS.RAPID_TRIGGER_DISENGAGE);
    setLocalADMode(false);
    setLocalZXMode(false);
    showStatus('Reset to defaults (click Save to apply)');
  };

  // Check if config has changed
  const hasChanges = config && (
    localActuationThreshold !== config.actuationThreshold ||
    localReleaseThreshold !== config.releaseThreshold ||
    localActuationMode !== config.actuationMode ||
    localDeadzone !== config.rapidTrigger.deadzone ||
    localEngageDistance !== config.rapidTrigger.engageDistance ||
    localDisengageDistance !== config.rapidTrigger.disengageDistance ||
    localADMode !== config.keyCancel.adMode ||
    localZXMode !== config.keyCancel.zxMode
  );

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
          HALL EFFECT CONFIGURATION <Badge>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</Badge>
        </Row>
        <Row>Configure actuation points, rapid trigger, and key cancel settings</Row>
        <br />
        <Card title="NAVIGATION">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <Button theme={item.href === '/hall-effect' ? 'PRIMARY' : 'SECONDARY'}>
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>

        {error && <AlertBanner>{error}</AlertBanner>}
        {errorMessage && <AlertBanner>{errorMessage}</AlertBanner>}
        {statusMessage && (
          <Card title="STATUS">
            <Row>{statusMessage}</Row>
          </Card>
        )}

        <Card title="CONNECTION">
          {!isConnected ? (
            <>
              <Row>Connect your Hall Effect keyboard to configure settings.</Row>
              <br />
              <Button onClick={handleConnect}>Connect Keyboard</Button>
            </>
          ) : (
            <>
              <Row>
                Connected to: <strong>{device?.productName}</strong>
              </Row>
              <br />
              <ButtonGroup
                items={[
                  { body: 'Reload Config', onClick: loadConfig, selected: false },
                  { body: 'Use Defaults', onClick: skipLoadConfig, selected: false },
                  { body: 'Disconnect', onClick: handleDisconnect, selected: false },
                ]}
              />
            </>
          )}
        </Card>

        {isConnected && config && (
          <>
            <Card title="ACTUATION MODE">
              <Row>Select how key presses are detected:</Row>
              <br />
              <ButtonGroup
                items={[
                  {
                    body: 'Normal',
                    onClick: () => setLocalActuationMode(HEActuationMode.NORMAL),
                    selected: localActuationMode === HEActuationMode.NORMAL,
                  },
                  {
                    body: 'Rapid Trigger',
                    onClick: () => setLocalActuationMode(HEActuationMode.RAPID_TRIGGER),
                    selected: localActuationMode === HEActuationMode.RAPID_TRIGGER,
                  },
                  {
                    body: 'Key Cancel',
                    onClick: () => setLocalActuationMode(HEActuationMode.KEY_CANCEL),
                    selected: localActuationMode === HEActuationMode.KEY_CANCEL,
                  },
                ]}
              />
              <br />
              <CodeBlock>{ACTUATION_MODE_DESCRIPTIONS[localActuationMode]}</CodeBlock>
            </Card>

            <CardDouble title="ACTUATION THRESHOLDS">
              <Row>Configure when keys register as pressed and released:</Row>
              <br />
              <Row>Actuation Point (pressed at this depth):</Row>
              <NumberRangeSlider
                value={localActuationThreshold}
                min={HE_RANGES.ACTUATION_THRESHOLD.min}
                max={HE_RANGES.ACTUATION_THRESHOLD.max}
                onChange={setLocalActuationThreshold}
              />
              <br />
              <Row>Release Point (released above this):</Row>
              <NumberRangeSlider
                value={localReleaseThreshold}
                min={HE_RANGES.RELEASE_THRESHOLD.min}
                max={HE_RANGES.RELEASE_THRESHOLD.max}
                onChange={setLocalReleaseThreshold}
              />
              {localReleaseThreshold >= localActuationThreshold && (
                <AlertBanner>Release threshold must be lower than actuation threshold</AlertBanner>
              )}

              <br />
              <Row>
                <div style={{
                  width: '100%',
                  height: '60px',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  position: 'relative',
                  borderRadius: '4px',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: `${localReleaseThreshold}%`,
                    width: `${localActuationThreshold - localReleaseThreshold}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    opacity: 0.3,
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: `${localActuationThreshold}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: 'var(--color-success)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: `${localReleaseThreshold}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: 'var(--color-error)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: `${localActuationThreshold}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                  }}>
                    ACT
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: `${localReleaseThreshold}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                  }}>
                    REL
                  </div>
                </div>
              </Row>
              <RowSpaceBetween>
                <span style={{ fontSize: '10px', opacity: 0.5 }}>Rest (0)</span>
                <span style={{ fontSize: '10px', opacity: 0.5 }}>Fully Pressed (100)</span>
              </RowSpaceBetween>
            </CardDouble>

            {(localActuationMode === HEActuationMode.RAPID_TRIGGER || localActuationMode === HEActuationMode.NORMAL) && (
              <Card title="RAPID TRIGGER SETTINGS">
                <Row>Fine-tune rapid trigger behavior:</Row>
                <br />
                <Row>Deadzone (ignore near rest):</Row>
                <NumberRangeSlider
                  value={localDeadzone}
                  min={HE_RANGES.RAPID_TRIGGER_DEADZONE.min}
                  max={HE_RANGES.RAPID_TRIGGER_DEADZONE.max}
                  onChange={setLocalDeadzone}
                />
                <br />
                <Row>Engage Distance (down to re-engage):</Row>
                <NumberRangeSlider
                  value={localEngageDistance}
                  min={HE_RANGES.RAPID_TRIGGER_ENGAGE.min}
                  max={HE_RANGES.RAPID_TRIGGER_ENGAGE.max}
                  onChange={setLocalEngageDistance}
                />
                <br />
                <Row>Disengage Distance (up to release):</Row>
                <NumberRangeSlider
                  value={localDisengageDistance}
                  min={HE_RANGES.RAPID_TRIGGER_DISENGAGE.min}
                  max={HE_RANGES.RAPID_TRIGGER_DISENGAGE.max}
                  onChange={setLocalDisengageDistance}
                />
              </Card>
            )}

            {localActuationMode === HEActuationMode.KEY_CANCEL && (
              <Card title="KEY CANCEL (SOCD) SETTINGS">
                <Row>Configure simultaneous opposite key cancellation:</Row>
                <br />
                <Checkbox
                  name="ad-cancel"
                  defaultChecked={localADMode}
                  onChange={(e) => setLocalADMode(e.target.checked)}
                >
                  A+D Cancellation — When A and D are pressed, cancel both (neutral)
                </Checkbox>
                <br />
                <Checkbox
                  name="zx-cancel"
                  defaultChecked={localZXMode}
                  onChange={(e) => setLocalZXMode(e.target.checked)}
                >
                  Z+X Cancellation — When Z and X are pressed, cancel both (neutral)
                </Checkbox>
              </Card>
            )}

            <Card title="CALIBRATION">
              <Row>Calibrate the Hall effect sensors for accurate readings:</Row>
              <br />
              {!isCalibrating ? (
                <Button onClick={startCalibration}>Start Calibration</Button>
              ) : (
                <>
                  <AlertBanner>
                    Calibration in progress - press each key fully to its bottom, then release.
                  </AlertBanner>
                  <br />
                  <Button theme="PRIMARY" onClick={saveCalibration}>Save Calibration</Button>
                </>
              )}
            </Card>

            <CardDouble title="RGB LIGHTING">
              <Row>Quick presets:</Row>
              <br />
              <ButtonGroup
                items={[
                  { body: 'Off', onClick: () => setRGBPreset('off'), selected: rgbEffect === RGBEffect.OFF },
                  { body: 'White', onClick: () => setRGBPreset('white'), selected: false },
                  { body: 'Red', onClick: () => setRGBPreset('red'), selected: false },
                  { body: 'Green', onClick: () => setRGBPreset('green'), selected: false },
                  { body: 'Blue', onClick: () => setRGBPreset('blue'), selected: false },
                  { body: 'Rainbow', onClick: () => setRGBPreset('rainbow'), selected: rgbEffect === RGBEffect.CYCLE_ALL },
                ]}
              />
              <br />
              <Row>Effect:</Row>
              <Select
                name="rgb-effect"
                options={RGB_EFFECT_OPTIONS}
                defaultValue={RGB_EFFECT_OPTIONS[rgbEffect] || 'Off'}
                onChange={(value) => {
                  const index = RGB_EFFECT_OPTIONS.indexOf(value);
                  if (index >= 0) {
                    setRgbEffect(index as RGBEffect);
                    viaRef.current?.setRGBEffect(index as RGBEffect);
                  }
                }}
              />
              <br />
              <Row>Brightness:</Row>
              <NumberRangeSlider
                value={rgbBrightness}
                min={0}
                max={255}
                onChange={(v) => {
                  setRgbBrightness(v);
                  sendRGBDebounced(() => viaRef.current?.setRGBBrightness(v) ?? Promise.resolve());
                }}
              />
              <br />
              <Row>Hue (0=Red, 85=Green, 170=Blue):</Row>
              <NumberRangeSlider
                value={rgbHue}
                min={0}
                max={255}
                onChange={(v) => {
                  setRgbHue(v);
                  sendRGBDebounced(() => viaRef.current?.setRGBColor1(v, rgbSat) ?? Promise.resolve());
                }}
              />
              <div style={{
                height: '8px',
                background: `linear-gradient(to right,
                  hsl(0, 100%, 50%),
                  hsl(60, 100%, 50%),
                  hsl(120, 100%, 50%),
                  hsl(180, 100%, 50%),
                  hsl(240, 100%, 50%),
                  hsl(300, 100%, 50%),
                  hsl(360, 100%, 50%))`,
                borderRadius: '2px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  left: `${rgbHue / 255 * 100}%`,
                  top: '-2px',
                  width: '4px',
                  height: '12px',
                  background: 'var(--color-text)',
                  transform: 'translateX(-50%)',
                }} />
              </div>
              <br />
              <Row>Saturation (0=White, 255=Full):</Row>
              <NumberRangeSlider
                value={rgbSat}
                min={0}
                max={255}
                onChange={(v) => {
                  setRgbSat(v);
                  sendRGBDebounced(() => viaRef.current?.setRGBColor1(rgbHue, v) ?? Promise.resolve());
                }}
              />
              <br />
              <Row>Effect Speed:</Row>
              <NumberRangeSlider
                value={rgbSpeed}
                min={0}
                max={255}
                onChange={(v) => {
                  setRgbSpeed(v);
                  sendRGBDebounced(() => viaRef.current?.setRGBEffectSpeed(v) ?? Promise.resolve());
                }}
              />
              <br />
              <RowSpaceBetween>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  background: `hsl(${rgbHue / 255 * 360}, ${rgbSat / 255 * 100}%, ${50 + (1 - rgbSat / 255) * 50}%)`,
                }} />
                <ButtonGroup
                  items={[
                    { body: 'Load', onClick: loadRGBConfig, selected: false },
                    { body: 'Apply', onClick: applyRGB, selected: false },
                    { body: 'Save', onClick: saveRGB, selected: false },
                  ]}
                />
              </RowSpaceBetween>
            </CardDouble>

            <Card title="SAVE CHANGES">
              <RowSpaceBetween>
                <div>
                  {hasChanges ? (
                    <Badge>UNSAVED CHANGES</Badge>
                  ) : (
                    <span style={{ opacity: 0.5 }}>No changes</span>
                  )}
                </div>
                <ButtonGroup
                  items={[
                    { body: 'Reset Defaults', onClick: resetToDefaults, selected: false },
                    {
                      body: isSaving ? 'Saving...' : 'Save to Keyboard',
                      onClick: saveConfig,
                      selected: hasChanges,
                    },
                  ]}
                />
              </RowSpaceBetween>
            </Card>

            <Card title="CURRENT CONFIGURATION">
              <CodeBlock>
{`Actuation Mode: ${ACTUATION_MODE_LABELS[config.actuationMode]}
Actuation Threshold: ${config.actuationThreshold}
Release Threshold: ${config.releaseThreshold}

Rapid Trigger:
  Deadzone: ${config.rapidTrigger.deadzone}
  Engage Distance: ${config.rapidTrigger.engageDistance}
  Disengage Distance: ${config.rapidTrigger.disengageDistance}

Key Cancel:
  A+D Mode: ${config.keyCancel.adMode ? 'ON' : 'OFF'}
  Z+X Mode: ${config.keyCancel.zxMode ? 'ON' : 'OFF'}`}
              </CodeBlock>
            </Card>
          </>
        )}

        {isConnected && isLoading && (
          <Card title="LOADING">
            <Row>Loading Hall Effect configuration from keyboard...</Row>
            <Row>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>
                This may take up to 5 seconds. If your keyboard doesn't support HE commands, click Skip.
              </span>
            </Row>
            <br />
            <Button theme="SECONDARY" onClick={skipLoadConfig}>
              Skip - Use Defaults
            </Button>
          </Card>
        )}
      </Grid>
    </>
  );
}
