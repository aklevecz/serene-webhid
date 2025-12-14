// VIA Protocol for QMK keyboards
// Reference: https://github.com/the-via/app
// Hall Effect support: https://github.com/SmollChungus/qmk_firmware/tree/dev_cleaver/keyboards/cleaver

export const VIA_PROTOCOL_VERSION = 0x0c;
export const RAW_HID_BUFFER_SIZE = 32;

// =============================================================================
// Hall Effect Configuration
// =============================================================================

// Hall Effect Custom Channel (used with CUSTOM_SET_VALUE/CUSTOM_GET_VALUE)
export const HE_CUSTOM_CHANNEL = 0;

// Hall Effect Custom Command IDs (sent as data[1] after channel)
export enum HECommand {
  ACTUATION_THRESHOLD = 1,
  RELEASE_THRESHOLD = 2,
  START_CALIBRATION = 4,
  SAVE_CALIBRATION = 5,
  TOGGLE_ACTUATION_MODE = 6,
  RAPID_TRIGGER_DEADZONE = 7,
  RAPID_TRIGGER_ENGAGE_DISTANCE = 8,
  RAPID_TRIGGER_DISENGAGE_DISTANCE = 9,
  KEYCANCEL_AD_MODE = 10,
  KEYCANCEL_ZX_MODE = 11,
}

// Hall Effect Actuation Modes
export enum HEActuationMode {
  NORMAL = 0,
  RAPID_TRIGGER = 1,
  KEY_CANCEL = 2,
}

// Hall Effect Configuration Defaults (from Cleaver HE firmware)
export const HE_DEFAULTS = {
  ACTUATION_THRESHOLD: 50,      // 0-100 scale, trigger point for key press
  RELEASE_THRESHOLD: 30,        // 0-100 scale, must be lower than actuation
  RAPID_TRIGGER_DEADZONE: 15,   // 15-60 range
  RAPID_TRIGGER_ENGAGE: 10,     // 5-20 range
  RAPID_TRIGGER_DISENGAGE: 10,  // 5-20 range
  NOISE_FLOOR: 510,             // Expected ADC value when unpressed
  NOISE_CEILING: 10,            // Expected ADC value when fully pressed (with margin)
} as const;

// Hall Effect Configuration Ranges
export const HE_RANGES = {
  ACTUATION_THRESHOLD: { min: 10, max: 90 },
  RELEASE_THRESHOLD: { min: 10, max: 90 },
  RAPID_TRIGGER_DEADZONE: { min: 15, max: 60 },
  RAPID_TRIGGER_ENGAGE: { min: 5, max: 20 },
  RAPID_TRIGGER_DISENGAGE: { min: 5, max: 20 },
} as const;

// Hall Effect Configuration Types
export interface HEConfig {
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

// Per-key Hall Effect Configuration
export interface HEKeyConfig {
  actuationThreshold: number;
  releaseThreshold: number;
  noiseFloor: number;
  noiseCeiling: number;
}

// =============================================================================
// RGB Lighting Configuration
// =============================================================================

// VIA Lighting Channel (used with CUSTOM_SET_VALUE/CUSTOM_GET_VALUE)
// Note: Standard VIA uses channel 1, but QMK RGB Matrix uses channel 2
export const LIGHTING_CHANNEL = 2;

// Lighting Value IDs (QMK RGB Matrix on channel 2)
// These differ from standard VIA lighting (channel 1)
export enum LightingValue {
  // QMK RGB Matrix values (channel 2) - used by Cleaver HE
  BRIGHTNESS = 0x01,   // Returns/sets brightness (0-255)
  EFFECT = 0x02,       // Returns/sets effect mode
  EFFECT_SPEED = 0x03, // Effect speed
  COLOR_1 = 0x04,      // Primary color (hue, sat as two bytes)
  COLOR_2 = 0x05,      // Secondary color

  // Standard VIA lighting values (channel 1) - for reference
  // VIA_BRIGHTNESS = 0x09,
  // VIA_EFFECT = 0x0a,
  // VIA_COLOR_1 = 0x0c,
}

// Common RGB Effects (QMK RGB Matrix effects)
export enum RGBEffect {
  OFF = 0,
  SOLID_COLOR = 1,
  BREATHING = 2,
  BAND_SPIRAL_VAL = 3,
  CYCLE_ALL = 4,
  CYCLE_LEFT_RIGHT = 5,
  CYCLE_UP_DOWN = 6,
  RAINBOW_MOVING_CHEVRON = 7,
  CYCLE_OUT_IN = 8,
  CYCLE_OUT_IN_DUAL = 9,
  CYCLE_PINWHEEL = 10,
  CYCLE_SPIRAL = 11,
  DUAL_BEACON = 12,
  RAINBOW_BEACON = 13,
  RAINBOW_PINWHEELS = 14,
  RAINDROPS = 15,
  JELLYBEAN_RAINDROPS = 16,
  HUE_BREATHING = 17,
  HUE_PENDULUM = 18,
  HUE_WAVE = 19,
  TYPING_HEATMAP = 20,
  DIGITAL_RAIN = 21,
  SOLID_REACTIVE_SIMPLE = 22,
  SOLID_REACTIVE = 23,
  SOLID_REACTIVE_WIDE = 24,
  SOLID_REACTIVE_MULTIWIDE = 25,
  SOLID_REACTIVE_CROSS = 26,
  SOLID_REACTIVE_MULTICROSS = 27,
  SOLID_REACTIVE_NEXUS = 28,
  SOLID_REACTIVE_MULTINEXUS = 29,
  SPLASH = 30,
  MULTISPLASH = 31,
  SOLID_SPLASH = 32,
  SOLID_MULTISPLASH = 33,
}

// RGB Configuration
export interface RGBConfig {
  brightness: number;    // 0-255
  effect: RGBEffect;
  effectSpeed: number;   // 0-255
  color1: { hue: number; sat: number }; // hue: 0-255, sat: 0-255
  color2: { hue: number; sat: number };
}

// =============================================================================
// Standard VIA Protocol
// =============================================================================

export enum VIACommand {
  GET_PROTOCOL_VERSION = 0x01,
  GET_KEYBOARD_VALUE = 0x02,
  SET_KEYBOARD_VALUE = 0x03,
  DYNAMIC_KEYMAP_GET_KEYCODE = 0x04,
  DYNAMIC_KEYMAP_SET_KEYCODE = 0x05,
  DYNAMIC_KEYMAP_RESET = 0x06,
  CUSTOM_SET_VALUE = 0x07,
  CUSTOM_GET_VALUE = 0x08,
  CUSTOM_SAVE = 0x09,
  EEPROM_RESET = 0x0a,
  BOOTLOADER_JUMP = 0x0b,
  DYNAMIC_KEYMAP_MACRO_GET_COUNT = 0x0c,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER_SIZE = 0x0d,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER = 0x0e,
  DYNAMIC_KEYMAP_MACRO_SET_BUFFER = 0x0f,
  DYNAMIC_KEYMAP_MACRO_RESET = 0x10,
  DYNAMIC_KEYMAP_GET_LAYER_COUNT = 0x11,
  DYNAMIC_KEYMAP_GET_BUFFER = 0x12,
  DYNAMIC_KEYMAP_SET_BUFFER = 0x13,
  DYNAMIC_KEYMAP_GET_ENCODER = 0x14,
  DYNAMIC_KEYMAP_SET_ENCODER = 0x15,
}

export enum KeyboardValue {
  UPTIME = 0x01,
  LAYOUT_OPTIONS = 0x02,
  SWITCH_MATRIX_STATE = 0x03,
  FIRMWARE_VERSION = 0x04,
  DEVICE_INDICATION = 0x05,
}

// Common QMK Keycodes
export const KEYCODES = {
  // Basic keys
  KC_NO: 0x0000,
  KC_TRANSPARENT: 0x0001,
  KC_A: 0x0004,
  KC_B: 0x0005,
  KC_C: 0x0006,
  KC_D: 0x0007,
  KC_E: 0x0008,
  KC_F: 0x0009,
  KC_G: 0x000a,
  KC_H: 0x000b,
  KC_I: 0x000c,
  KC_J: 0x000d,
  KC_K: 0x000e,
  KC_L: 0x000f,
  KC_M: 0x0010,
  KC_N: 0x0011,
  KC_O: 0x0012,
  KC_P: 0x0013,
  KC_Q: 0x0014,
  KC_R: 0x0015,
  KC_S: 0x0016,
  KC_T: 0x0017,
  KC_U: 0x0018,
  KC_V: 0x0019,
  KC_W: 0x001a,
  KC_X: 0x001b,
  KC_Y: 0x001c,
  KC_Z: 0x001d,
  KC_1: 0x001e,
  KC_2: 0x001f,
  KC_3: 0x0020,
  KC_4: 0x0021,
  KC_5: 0x0022,
  KC_6: 0x0023,
  KC_7: 0x0024,
  KC_8: 0x0025,
  KC_9: 0x0026,
  KC_0: 0x0027,
  KC_ENTER: 0x0028,
  KC_ESCAPE: 0x0029,
  KC_BACKSPACE: 0x002a,
  KC_TAB: 0x002b,
  KC_SPACE: 0x002c,
  KC_MINUS: 0x002d,
  KC_EQUAL: 0x002e,
  KC_LEFT_BRACKET: 0x002f,
  KC_RIGHT_BRACKET: 0x0030,
  KC_BACKSLASH: 0x0031,
  KC_SEMICOLON: 0x0033,
  KC_QUOTE: 0x0034,
  KC_GRAVE: 0x0035,
  KC_COMMA: 0x0036,
  KC_DOT: 0x0037,
  KC_SLASH: 0x0038,
  KC_CAPS_LOCK: 0x0039,
  KC_F1: 0x003a,
  KC_F2: 0x003b,
  KC_F3: 0x003c,
  KC_F4: 0x003d,
  KC_F5: 0x003e,
  KC_F6: 0x003f,
  KC_F7: 0x0040,
  KC_F8: 0x0041,
  KC_F9: 0x0042,
  KC_F10: 0x0043,
  KC_F11: 0x0044,
  KC_F12: 0x0045,
  KC_PRINT_SCREEN: 0x0046,
  KC_SCROLL_LOCK: 0x0047,
  KC_PAUSE: 0x0048,
  KC_INSERT: 0x0049,
  KC_HOME: 0x004a,
  KC_PAGE_UP: 0x004b,
  KC_DELETE: 0x004c,
  KC_END: 0x004d,
  KC_PAGE_DOWN: 0x004e,
  KC_RIGHT: 0x004f,
  KC_LEFT: 0x0050,
  KC_DOWN: 0x0051,
  KC_UP: 0x0052,
  // Modifiers
  KC_LEFT_CTRL: 0x00e0,
  KC_LEFT_SHIFT: 0x00e1,
  KC_LEFT_ALT: 0x00e2,
  KC_LEFT_GUI: 0x00e3,
  KC_RIGHT_CTRL: 0x00e4,
  KC_RIGHT_SHIFT: 0x00e5,
  KC_RIGHT_ALT: 0x00e6,
  KC_RIGHT_GUI: 0x00e7,
  // Layer keys (QMK specific)
  MO_0: 0x5220,
  MO_1: 0x5221,
  MO_2: 0x5222,
  MO_3: 0x5223,
  TG_0: 0x5240,
  TG_1: 0x5241,
  TG_2: 0x5242,
  TG_3: 0x5243,
  // Media keys
  KC_MUTE: 0x00a8,
  KC_VOL_UP: 0x00a9,
  KC_VOL_DOWN: 0x00aa,
  KC_MEDIA_PLAY_PAUSE: 0x00b4,
  KC_MEDIA_NEXT_TRACK: 0x00b5,
  KC_MEDIA_PREV_TRACK: 0x00b6,
} as const;

// Reverse lookup for keycode names
export const KEYCODE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(KEYCODES).map(([name, code]) => [code, name.replace('KC_', '')])
);

// Display labels for keys
export const KEY_LABELS: Record<number, string> = {
  [KEYCODES.KC_NO]: '',
  [KEYCODES.KC_TRANSPARENT]: '▽',
  [KEYCODES.KC_ENTER]: '↵',
  [KEYCODES.KC_ESCAPE]: 'ESC',
  [KEYCODES.KC_BACKSPACE]: '⌫',
  [KEYCODES.KC_TAB]: '⇥',
  [KEYCODES.KC_SPACE]: '␣',
  [KEYCODES.KC_CAPS_LOCK]: 'CAPS',
  [KEYCODES.KC_LEFT_CTRL]: 'CTRL',
  [KEYCODES.KC_LEFT_SHIFT]: '⇧',
  [KEYCODES.KC_LEFT_ALT]: 'ALT',
  [KEYCODES.KC_LEFT_GUI]: '⌘',
  [KEYCODES.KC_RIGHT_CTRL]: 'CTRL',
  [KEYCODES.KC_RIGHT_SHIFT]: '⇧',
  [KEYCODES.KC_RIGHT_ALT]: 'ALT',
  [KEYCODES.KC_RIGHT_GUI]: '⌘',
  [KEYCODES.KC_UP]: '↑',
  [KEYCODES.KC_DOWN]: '↓',
  [KEYCODES.KC_LEFT]: '←',
  [KEYCODES.KC_RIGHT]: '→',
  [KEYCODES.KC_DELETE]: 'DEL',
  [KEYCODES.KC_HOME]: 'HOME',
  [KEYCODES.KC_END]: 'END',
  [KEYCODES.KC_PAGE_UP]: 'PGUP',
  [KEYCODES.KC_PAGE_DOWN]: 'PGDN',
  [KEYCODES.KC_INSERT]: 'INS',
  [KEYCODES.KC_MUTE]: '🔇',
  [KEYCODES.KC_VOL_UP]: '🔊',
  [KEYCODES.KC_VOL_DOWN]: '🔉',
  [KEYCODES.KC_MEDIA_PLAY_PAUSE]: '⏯',
  [KEYCODES.KC_MEDIA_NEXT_TRACK]: '⏭',
  [KEYCODES.KC_MEDIA_PREV_TRACK]: '⏮',
  [KEYCODES.MO_0]: 'MO(0)',
  [KEYCODES.MO_1]: 'MO(1)',
  [KEYCODES.MO_2]: 'MO(2)',
  [KEYCODES.MO_3]: 'MO(3)',
  [KEYCODES.TG_0]: 'TG(0)',
  [KEYCODES.TG_1]: 'TG(1)',
  [KEYCODES.TG_2]: 'TG(2)',
  [KEYCODES.TG_3]: 'TG(3)',
};

export function getKeyLabel(keycode: number): string {
  if (KEY_LABELS[keycode] !== undefined) {
    return KEY_LABELS[keycode];
  }
  if (KEYCODE_NAMES[keycode]) {
    return KEYCODE_NAMES[keycode];
  }
  // For letter keys, just return the letter
  if (keycode >= KEYCODES.KC_A && keycode <= KEYCODES.KC_Z) {
    return String.fromCharCode(65 + (keycode - KEYCODES.KC_A));
  }
  // For number keys
  if (keycode >= KEYCODES.KC_1 && keycode <= KEYCODES.KC_9) {
    return String(keycode - KEYCODES.KC_1 + 1);
  }
  if (keycode === KEYCODES.KC_0) {
    return '0';
  }
  // For F keys
  if (keycode >= KEYCODES.KC_F1 && keycode <= KEYCODES.KC_F12) {
    return `F${keycode - KEYCODES.KC_F1 + 1}`;
  }
  return `0x${keycode.toString(16).toUpperCase()}`;
}

export class VIAProtocol {
  private device: HIDDevice | null = null;
  private pendingRequests: Map<number, { resolve: (data: Uint8Array) => void; reject: (error: Error) => void }> = new Map();
  private requestId = 0;

  async connect(device: HIDDevice) {
    this.device = device;
    device.addEventListener('inputreport', this.handleInputReport.bind(this));
  }

  disconnect() {
    if (this.device) {
      this.device.removeEventListener('inputreport', this.handleInputReport.bind(this));
      this.device = null;
    }
  }

  private handleInputReport(event: HIDInputReportEvent) {
    const data = new Uint8Array(event.data.buffer);
    const commandId = data[0];

    // Resolve any pending request
    const pending = this.pendingRequests.get(commandId);
    if (pending) {
      pending.resolve(data);
      this.pendingRequests.delete(commandId);
    }
  }

  private async sendCommand(command: VIACommand, data: number[] = []): Promise<Uint8Array> {
    if (!this.device || !this.device.opened) {
      throw new Error('Device not connected');
    }

    // Clear any stale pending request for this command
    if (this.pendingRequests.has(command)) {
      this.pendingRequests.delete(command);
    }

    const buffer = new Uint8Array(RAW_HID_BUFFER_SIZE);
    buffer[0] = command;
    for (let i = 0; i < data.length && i < RAW_HID_BUFFER_SIZE - 1; i++) {
      buffer[i + 1] = data[i];
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(command)) {
          this.pendingRequests.delete(command);
          reject(new Error('Request timed out'));
        }
      }, 500); // Shorter timeout for faster recovery

      this.pendingRequests.set(command, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        },
      });

      this.device!.sendReport(0, buffer).catch((err) => {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(command);
        reject(err);
      });
    });
  }

  async getProtocolVersion(): Promise<number> {
    const response = await this.sendCommand(VIACommand.GET_PROTOCOL_VERSION);
    return (response[1] << 8) | response[2];
  }

  async getLayerCount(): Promise<number> {
    const response = await this.sendCommand(VIACommand.DYNAMIC_KEYMAP_GET_LAYER_COUNT);
    return response[1];
  }

  async getKeycode(layer: number, row: number, col: number): Promise<number> {
    const response = await this.sendCommand(VIACommand.DYNAMIC_KEYMAP_GET_KEYCODE, [layer, row, col]);
    return (response[4] << 8) | response[5];
  }

  async setKeycode(layer: number, row: number, col: number, keycode: number): Promise<void> {
    await this.sendCommand(VIACommand.DYNAMIC_KEYMAP_SET_KEYCODE, [
      layer,
      row,
      col,
      (keycode >> 8) & 0xff,
      keycode & 0xff,
    ]);
  }

  async getKeymapBuffer(offset: number, size: number): Promise<Uint8Array> {
    const response = await this.sendCommand(VIACommand.DYNAMIC_KEYMAP_GET_BUFFER, [
      (offset >> 8) & 0xff,
      offset & 0xff,
      size,
    ]);
    return response.slice(4, 4 + size);
  }

  async resetKeymap(): Promise<void> {
    await this.sendCommand(VIACommand.DYNAMIC_KEYMAP_RESET);
  }

  async resetEEPROM(): Promise<void> {
    await this.sendCommand(VIACommand.EEPROM_RESET);
  }

  async jumpToBootloader(): Promise<void> {
    await this.sendCommand(VIACommand.BOOTLOADER_JUMP);
  }

  async getMatrixState(): Promise<Set<string>> {
    const response = await this.sendCommand(VIACommand.GET_KEYBOARD_VALUE, [KeyboardValue.SWITCH_MATRIX_STATE]);
    const pressedKeys = new Set<string>();

    // Response format: [cmd, subcmd, ...matrix_data]
    // Matrix data is a bitmap where each bit represents a key
    // The exact format depends on the keyboard's matrix size
    const matrixData = response.slice(2);

    // Parse the bitmap - each byte contains 8 keys
    // Bit order: col0-7 for row0, then col0-7 for row1, etc.
    for (let byteIndex = 0; byteIndex < matrixData.length; byteIndex++) {
      const byte = matrixData[byteIndex];
      if (byte === 0) continue;

      for (let bit = 0; bit < 8; bit++) {
        if (byte & (1 << bit)) {
          // Calculate row and column from byte position and bit
          const keyIndex = byteIndex * 8 + bit;
          const row = Math.floor(keyIndex / 16); // Assuming max 16 cols
          const col = keyIndex % 16;
          pressedKeys.add(`${row},${col}`);
        }
      }
    }

    return pressedKeys;
  }

  // ===========================================================================
  // Hall Effect Methods
  // ===========================================================================

  // Get a Hall Effect custom value
  private async getHEValue(command: HECommand): Promise<number> {
    const response = await this.sendCommand(VIACommand.CUSTOM_GET_VALUE, [
      HE_CUSTOM_CHANNEL,
      command,
    ]);
    // Response format: [cmd, channel, command_id, value]
    return response[3];
  }

  // Set a Hall Effect custom value
  private async setHEValue(command: HECommand, value: number): Promise<void> {
    await this.sendCommand(VIACommand.CUSTOM_SET_VALUE, [
      HE_CUSTOM_CHANNEL,
      command,
      value,
    ]);
  }

  // Save Hall Effect configuration to EEPROM
  async heCustomSave(): Promise<void> {
    await this.sendCommand(VIACommand.CUSTOM_SAVE, [HE_CUSTOM_CHANNEL]);
  }

  // --- Actuation Threshold ---
  async getHEActuationThreshold(): Promise<number> {
    return this.getHEValue(HECommand.ACTUATION_THRESHOLD);
  }

  async setHEActuationThreshold(value: number): Promise<void> {
    const clamped = Math.max(HE_RANGES.ACTUATION_THRESHOLD.min, Math.min(HE_RANGES.ACTUATION_THRESHOLD.max, value));
    await this.setHEValue(HECommand.ACTUATION_THRESHOLD, clamped);
  }

  // --- Release Threshold ---
  async getHEReleaseThreshold(): Promise<number> {
    return this.getHEValue(HECommand.RELEASE_THRESHOLD);
  }

  async setHEReleaseThreshold(value: number): Promise<void> {
    const clamped = Math.max(HE_RANGES.RELEASE_THRESHOLD.min, Math.min(HE_RANGES.RELEASE_THRESHOLD.max, value));
    await this.setHEValue(HECommand.RELEASE_THRESHOLD, clamped);
  }

  // --- Actuation Mode ---
  async getHEActuationMode(): Promise<HEActuationMode> {
    const mode = await this.getHEValue(HECommand.TOGGLE_ACTUATION_MODE);
    return mode as HEActuationMode;
  }

  async setHEActuationMode(mode: HEActuationMode): Promise<void> {
    await this.setHEValue(HECommand.TOGGLE_ACTUATION_MODE, mode);
  }

  async toggleHEActuationMode(): Promise<HEActuationMode> {
    // Toggle cycles through: Normal -> Rapid Trigger -> Key Cancel -> Normal
    const current = await this.getHEActuationMode();
    const next = (current + 1) % 3 as HEActuationMode;
    await this.setHEActuationMode(next);
    return next;
  }

  // --- Rapid Trigger Configuration ---
  async getHERapidTriggerDeadzone(): Promise<number> {
    return this.getHEValue(HECommand.RAPID_TRIGGER_DEADZONE);
  }

  async setHERapidTriggerDeadzone(value: number): Promise<void> {
    const clamped = Math.max(HE_RANGES.RAPID_TRIGGER_DEADZONE.min, Math.min(HE_RANGES.RAPID_TRIGGER_DEADZONE.max, value));
    await this.setHEValue(HECommand.RAPID_TRIGGER_DEADZONE, clamped);
  }

  async getHERapidTriggerEngageDistance(): Promise<number> {
    return this.getHEValue(HECommand.RAPID_TRIGGER_ENGAGE_DISTANCE);
  }

  async setHERapidTriggerEngageDistance(value: number): Promise<void> {
    const clamped = Math.max(HE_RANGES.RAPID_TRIGGER_ENGAGE.min, Math.min(HE_RANGES.RAPID_TRIGGER_ENGAGE.max, value));
    await this.setHEValue(HECommand.RAPID_TRIGGER_ENGAGE_DISTANCE, clamped);
  }

  async getHERapidTriggerDisengageDistance(): Promise<number> {
    return this.getHEValue(HECommand.RAPID_TRIGGER_DISENGAGE_DISTANCE);
  }

  async setHERapidTriggerDisengageDistance(value: number): Promise<void> {
    const clamped = Math.max(HE_RANGES.RAPID_TRIGGER_DISENGAGE.min, Math.min(HE_RANGES.RAPID_TRIGGER_DISENGAGE.max, value));
    await this.setHEValue(HECommand.RAPID_TRIGGER_DISENGAGE_DISTANCE, clamped);
  }

  // --- Key Cancel Configuration ---
  async getHEKeyCancelADMode(): Promise<boolean> {
    return (await this.getHEValue(HECommand.KEYCANCEL_AD_MODE)) !== 0;
  }

  async setHEKeyCancelADMode(enabled: boolean): Promise<void> {
    await this.setHEValue(HECommand.KEYCANCEL_AD_MODE, enabled ? 1 : 0);
  }

  async getHEKeyCancelZXMode(): Promise<boolean> {
    return (await this.getHEValue(HECommand.KEYCANCEL_ZX_MODE)) !== 0;
  }

  async setHEKeyCancelZXMode(enabled: boolean): Promise<void> {
    await this.setHEValue(HECommand.KEYCANCEL_ZX_MODE, enabled ? 1 : 0);
  }

  // --- Calibration ---
  async startHECalibration(): Promise<void> {
    await this.setHEValue(HECommand.START_CALIBRATION, 1);
  }

  async saveHECalibration(): Promise<void> {
    await this.setHEValue(HECommand.SAVE_CALIBRATION, 1);
  }

  // --- Get Full HE Configuration ---
  // Note: Requests are sent sequentially because many keyboards can't handle parallel HID requests
  async getHEConfig(): Promise<HEConfig> {
    const actuationMode = await this.getHEActuationMode();
    const actuationThreshold = await this.getHEActuationThreshold();
    const releaseThreshold = await this.getHEReleaseThreshold();
    const deadzone = await this.getHERapidTriggerDeadzone();
    const engageDistance = await this.getHERapidTriggerEngageDistance();
    const disengageDistance = await this.getHERapidTriggerDisengageDistance();
    const adMode = await this.getHEKeyCancelADMode();
    const zxMode = await this.getHEKeyCancelZXMode();

    return {
      actuationMode,
      actuationThreshold,
      releaseThreshold,
      rapidTrigger: {
        deadzone,
        engageDistance,
        disengageDistance,
      },
      keyCancel: {
        adMode,
        zxMode,
      },
    };
  }

  // --- Set Full HE Configuration ---
  // Note: Requests are sent sequentially because many keyboards can't handle parallel HID requests
  async setHEConfig(config: Partial<HEConfig>): Promise<void> {
    if (config.actuationMode !== undefined) {
      await this.setHEActuationMode(config.actuationMode);
    }
    if (config.actuationThreshold !== undefined) {
      await this.setHEActuationThreshold(config.actuationThreshold);
    }
    if (config.releaseThreshold !== undefined) {
      await this.setHEReleaseThreshold(config.releaseThreshold);
    }
    if (config.rapidTrigger) {
      if (config.rapidTrigger.deadzone !== undefined) {
        await this.setHERapidTriggerDeadzone(config.rapidTrigger.deadzone);
      }
      if (config.rapidTrigger.engageDistance !== undefined) {
        await this.setHERapidTriggerEngageDistance(config.rapidTrigger.engageDistance);
      }
      if (config.rapidTrigger.disengageDistance !== undefined) {
        await this.setHERapidTriggerDisengageDistance(config.rapidTrigger.disengageDistance);
      }
    }
    if (config.keyCancel) {
      if (config.keyCancel.adMode !== undefined) {
        await this.setHEKeyCancelADMode(config.keyCancel.adMode);
      }
      if (config.keyCancel.zxMode !== undefined) {
        await this.setHEKeyCancelZXMode(config.keyCancel.zxMode);
      }
    }
  }

  // ===========================================================================
  // RGB Lighting Methods
  // ===========================================================================

  // Get a lighting value
  private async getLightingValue(valueId: LightingValue): Promise<Uint8Array> {
    const response = await this.sendCommand(VIACommand.CUSTOM_GET_VALUE, [
      LIGHTING_CHANNEL,
      valueId,
    ]);
    return response;
  }

  // Set a lighting value (fire-and-forget, no response expected)
  private async setLightingValue(valueId: LightingValue, ...values: number[]): Promise<void> {
    if (!this.device || !this.device.opened) {
      throw new Error('Device not connected');
    }

    const buffer = new Uint8Array(RAW_HID_BUFFER_SIZE);
    buffer[0] = VIACommand.CUSTOM_SET_VALUE;
    buffer[1] = LIGHTING_CHANNEL;
    buffer[2] = valueId;
    for (let i = 0; i < values.length; i++) {
      buffer[3 + i] = values[i];
    }

    // Fire and forget - don't wait for response
    await this.device.sendReport(0, buffer);
  }

  // Save lighting configuration to EEPROM
  async saveLighting(): Promise<void> {
    await this.sendCommand(VIACommand.CUSTOM_SAVE, [LIGHTING_CHANNEL]);
  }

  // --- Brightness ---
  async getRGBBrightness(): Promise<number> {
    const response = await this.getLightingValue(LightingValue.BRIGHTNESS);
    return response[3];
  }

  async setRGBBrightness(brightness: number): Promise<void> {
    const clamped = Math.max(0, Math.min(255, brightness));
    await this.setLightingValue(LightingValue.BRIGHTNESS, clamped);
  }

  // --- Effect Mode ---
  async getRGBEffect(): Promise<RGBEffect> {
    const response = await this.getLightingValue(LightingValue.EFFECT);
    return response[3] as RGBEffect;
  }

  async setRGBEffect(effect: RGBEffect): Promise<void> {
    await this.setLightingValue(LightingValue.EFFECT, effect);
  }

  // --- Effect Speed ---
  async getRGBEffectSpeed(): Promise<number> {
    const response = await this.getLightingValue(LightingValue.EFFECT_SPEED);
    return response[3];
  }

  async setRGBEffectSpeed(speed: number): Promise<void> {
    const clamped = Math.max(0, Math.min(255, speed));
    await this.setLightingValue(LightingValue.EFFECT_SPEED, clamped);
  }

  // --- Colors ---
  async getRGBColor1(): Promise<{ hue: number; sat: number }> {
    const response = await this.getLightingValue(LightingValue.COLOR_1);
    return { hue: response[3], sat: response[4] };
  }

  async setRGBColor1(hue: number, sat: number): Promise<void> {
    await this.setLightingValue(LightingValue.COLOR_1, hue & 0xff, sat & 0xff);
  }

  async getRGBColor2(): Promise<{ hue: number; sat: number }> {
    const response = await this.getLightingValue(LightingValue.COLOR_2);
    return { hue: response[3], sat: response[4] };
  }

  async setRGBColor2(hue: number, sat: number): Promise<void> {
    await this.setLightingValue(LightingValue.COLOR_2, hue & 0xff, sat & 0xff);
  }

  // --- Get Full RGB Config ---
  async getRGBConfig(): Promise<RGBConfig> {
    const brightness = await this.getRGBBrightness();
    const effect = await this.getRGBEffect();
    const effectSpeed = await this.getRGBEffectSpeed();
    const color1 = await this.getRGBColor1();
    const color2 = await this.getRGBColor2();

    return {
      brightness,
      effect,
      effectSpeed,
      color1,
      color2,
    };
  }

  // --- Quick RGB Controls ---
  async setRGBOff(): Promise<void> {
    await this.setRGBEffect(RGBEffect.OFF);
  }

  async setRGBSolidColor(hue: number, sat: number, brightness?: number): Promise<void> {
    await this.setRGBEffect(RGBEffect.SOLID_COLOR);
    await this.setRGBColor1(hue, sat);
    if (brightness !== undefined) {
      await this.setRGBBrightness(brightness);
    }
  }

  async setRGBRainbow(): Promise<void> {
    await this.setRGBEffect(RGBEffect.CYCLE_ALL);
  }
}
