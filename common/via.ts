// VIA Protocol for QMK keyboards
// Reference: https://github.com/the-via/app

export const VIA_PROTOCOL_VERSION = 0x0c;
export const RAW_HID_BUFFER_SIZE = 32;

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

    const buffer = new Uint8Array(RAW_HID_BUFFER_SIZE);
    buffer[0] = command;
    for (let i = 0; i < data.length && i < RAW_HID_BUFFER_SIZE - 1; i++) {
      buffer[i + 1] = data[i];
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(command, { resolve, reject });

      this.device!.sendReport(0, buffer).catch((err) => {
        this.pendingRequests.delete(command);
        reject(err);
      });

      // Timeout after 1 second
      setTimeout(() => {
        if (this.pendingRequests.has(command)) {
          this.pendingRequests.delete(command);
          reject(new Error('Request timed out'));
        }
      }, 1000);
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
}
