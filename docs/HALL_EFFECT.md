# Hall Effect Keyboard Configuration

This document describes the Hall Effect (HE) keyboard support in serene-webhid, based on the [Cleaver HE firmware](https://github.com/SmollChungus/qmk_firmware/tree/dev_cleaver/keyboards/cleaver/hall_effect).

## Overview

Hall Effect keyboards use magnetic sensors instead of physical switch contacts to detect key presses. This enables:

- **Adjustable actuation points** - Customize how far you need to press before a key registers
- **Rapid Trigger** - Dynamic re-actuation for faster repeated presses
- **Key Cancel (SOCD)** - Simultaneous opposite cardinal direction cleaning for competitive gaming
- **Analog input** - Continuous position sensing (0-100 scale)

## VIA Protocol Integration

Hall Effect configuration uses VIA's custom value commands:

| Command | ID | Description |
|---------|----|-----------|
| `CUSTOM_GET_VALUE` | `0x08` | Read HE configuration values |
| `CUSTOM_SET_VALUE` | `0x07` | Write HE configuration values |
| `CUSTOM_SAVE` | `0x09` | Persist changes to EEPROM |

All HE commands use **Channel 0** (`HE_CUSTOM_CHANNEL = 0`).

## Configuration Parameters

### Actuation Thresholds

| Parameter | Command ID | Range | Default | Description |
|-----------|------------|-------|---------|-------------|
| Actuation Threshold | 1 | 10-90 | 50 | Key registers as pressed at this depth |
| Release Threshold | 2 | 10-90 | 30 | Key registers as released above this point |

**Important:** Release threshold must always be lower than actuation threshold.

### Actuation Modes

| Mode | Value | Description |
|------|-------|-------------|
| Normal | 0 | Standard fixed-threshold actuation |
| Rapid Trigger | 1 | Dynamic boundaries for fast repeated presses |
| Key Cancel | 2 | SOCD cleaning for competitive gaming |

Toggle actuation mode with command ID `6`.

### Rapid Trigger Settings

| Parameter | Command ID | Range | Default | Description |
|-----------|------------|-------|---------|-------------|
| Deadzone | 7 | 15-60 | 15 | Ignore movement near rest position |
| Engage Distance | 8 | 5-20 | 10 | Travel distance to re-engage |
| Disengage Distance | 9 | 5-20 | 10 | Travel distance to disengage |

#### How Rapid Trigger Works

1. Initial press follows normal actuation threshold
2. Once actuated, system tracks a "boundary value"
3. **Re-engage:** Value must exceed `boundary + engage_distance`
4. **Disengage:** Value must fall below `boundary - disengage_distance`
5. Boundary updates dynamically as you modulate pressure
6. Deadzone prevents false triggers near rest position

### Key Cancel (SOCD) Settings

| Parameter | Command ID | Description |
|-----------|------------|-------------|
| A+D Cancel | 10 | When A and D pressed simultaneously, output neutral |
| Z+X Cancel | 11 | When Z and X pressed simultaneously, output neutral |

Enable with value `1`, disable with `0`.

## Calibration

Hall Effect sensors require calibration to establish the noise floor (rest position) and noise ceiling (fully pressed).

### Calibration Process

1. **Start Calibration** (Command ID 4)
   - System begins sampling sensor values
   - Noise floor is calculated from rest position readings

2. **Press All Keys**
   - Press each key fully to its bottom
   - System records the minimum values as noise ceiling

3. **Save Calibration** (Command ID 5)
   - Writes calibration data to EEPROM
   - Values persist across power cycles

### Calibration Values

| Parameter | Expected Value | Description |
|-----------|----------------|-------------|
| Noise Floor | ~510 | ADC value when key is unpressed |
| Noise Ceiling | ~10 | ADC value when key is fully pressed |

## Hardware Details (Cleaver HE)

| Specification | Value |
|---------------|-------|
| Matrix Size | 5 rows x 15 columns |
| Total Sensors | 68 |
| ADC Port | A3 |
| Multiplexer Enable Pins | A5, A4, A7, B0, A6 |
| Multiplexer Select Pins | B3, B4, B6, B5 |
| Debounce Threshold | 5 |
| Noise Floor Samples | 10 |

## API Reference

### TypeScript Types

```typescript
// Actuation modes
enum HEActuationMode {
  NORMAL = 0,
  RAPID_TRIGGER = 1,
  KEY_CANCEL = 2,
}

// Full configuration interface
interface HEConfig {
  actuationMode: HEActuationMode;
  actuationThreshold: number;
  releaseThreshold: number;
  rapidTrigger: {
    deadzone: number;
    engageDistance: number;
    disengageDistance: number;
  };
  keyCancel: {
    adMode: boolean;
    zxMode: boolean;
  };
}

// Per-key configuration (if supported)
interface HEKeyConfig {
  actuationThreshold: number;
  releaseThreshold: number;
  noiseFloor: number;
  noiseCeiling: number;
}
```

### VIAProtocol Methods

```typescript
class VIAProtocol {
  // Get/Set individual values
  getHEActuationThreshold(): Promise<number>
  setHEActuationThreshold(value: number): Promise<void>
  getHEReleaseThreshold(): Promise<number>
  setHEReleaseThreshold(value: number): Promise<void>

  // Actuation mode
  getHEActuationMode(): Promise<HEActuationMode>
  setHEActuationMode(mode: HEActuationMode): Promise<void>
  toggleHEActuationMode(): Promise<HEActuationMode>

  // Rapid trigger
  getHERapidTriggerDeadzone(): Promise<number>
  setHERapidTriggerDeadzone(value: number): Promise<void>
  getHERapidTriggerEngageDistance(): Promise<number>
  setHERapidTriggerEngageDistance(value: number): Promise<void>
  getHERapidTriggerDisengageDistance(): Promise<number>
  setHERapidTriggerDisengageDistance(value: number): Promise<void>

  // Key cancel
  getHEKeyCancelADMode(): Promise<boolean>
  setHEKeyCancelADMode(enabled: boolean): Promise<void>
  getHEKeyCancelZXMode(): Promise<boolean>
  setHEKeyCancelZXMode(enabled: boolean): Promise<void>

  // Calibration
  startHECalibration(): Promise<void>
  saveHECalibration(): Promise<void>

  // Bulk operations
  getHEConfig(): Promise<HEConfig>
  setHEConfig(config: Partial<HEConfig>): Promise<void>
  heCustomSave(): Promise<void>
}
```

## Web Interface

### Hall Effect Configuration Page

Navigate to `/hall-effect` to access the dedicated configuration UI:

- Connect your HE keyboard via WebHID
- Adjust actuation/release thresholds with sliders
- Select actuation mode (Normal/Rapid Trigger/Key Cancel)
- Configure rapid trigger parameters
- Enable/disable SOCD key cancellation
- Run sensor calibration
- Save configuration to keyboard EEPROM

### Analog Diagnostic Tool

The `/analog-diagnostic` page includes Hall Effect testing features:

- Scan all HE configuration values
- Test individual HE commands
- Start/save calibration
- View raw HID reports for debugging

## Firmware Source

The Hall Effect implementation is based on:

- **Repository:** [SmollChungus/qmk_firmware](https://github.com/SmollChungus/qmk_firmware)
- **Branch:** `dev_cleaver`
- **Path:** `keyboards/cleaver/hall_effect/`

### Key Firmware Files

| File | Description |
|------|-------------|
| `he_switch_matrix.c` | Hall effect sensor driver |
| `he_switch_matrix.h` | Configuration structs and API |
| `matrix.c` | Matrix scanning implementation |
| `config.h` | Hardware configuration and defaults |
| `cleaver_he_via_definitions.json` | VIA UI definitions |

## Building Firmware

```bash
# Compile firmware
make cleaver/hall_effect:default

# Compile and flash
make cleaver/hall_effect:default:flash
```

### Bootloader Entry

1. **Bootmagic Reset:** Hold top-left key (ESC) while plugging in
2. **Physical:** Short Boot0 pins on PCB while connecting
3. **Software:** Press key mapped to `QK_BOOT`

## Troubleshooting

### Configuration Not Saving

- Ensure you call `heCustomSave()` after setting values
- Check that the keyboard supports EEPROM persistence
- Try resetting EEPROM and reconfiguring

### Keys Not Registering

- Run calibration to establish proper noise floor/ceiling
- Check that actuation threshold isn't set too high
- Verify release threshold is lower than actuation threshold

### Rapid Trigger Issues

- Increase deadzone if getting false triggers at rest
- Decrease engage/disengage distance for more sensitivity
- Ensure actuation mode is set to Rapid Trigger (1)

### SOCD Not Working

- Verify actuation mode is set to Key Cancel (2)
- Enable the specific key pairs (A+D and/or Z+X)
- Check that the firmware supports Key Cancel mode
