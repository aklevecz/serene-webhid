'use client';

import styles from './KeyboardLayout.module.scss';
import { getKeyLabel } from '@common/via';

export interface KeyDefinition {
  row: number;
  col: number;
  x: number;
  y: number;
  w?: number;  // width in units (default 1)
  h?: number;  // height in units (default 1)
  label?: string;
}

// Example 60% ANSI layout - you can customize this for your keyboard
export const LAYOUT_60_ANSI: KeyDefinition[] = [
  // Row 0
  { row: 0, col: 0, x: 0, y: 0, label: '`' },
  { row: 0, col: 1, x: 1, y: 0, label: '1' },
  { row: 0, col: 2, x: 2, y: 0, label: '2' },
  { row: 0, col: 3, x: 3, y: 0, label: '3' },
  { row: 0, col: 4, x: 4, y: 0, label: '4' },
  { row: 0, col: 5, x: 5, y: 0, label: '5' },
  { row: 0, col: 6, x: 6, y: 0, label: '6' },
  { row: 0, col: 7, x: 7, y: 0, label: '7' },
  { row: 0, col: 8, x: 8, y: 0, label: '8' },
  { row: 0, col: 9, x: 9, y: 0, label: '9' },
  { row: 0, col: 10, x: 10, y: 0, label: '0' },
  { row: 0, col: 11, x: 11, y: 0, label: '-' },
  { row: 0, col: 12, x: 12, y: 0, label: '=' },
  { row: 0, col: 13, x: 13, y: 0, w: 2, label: 'BKSP' },
  // Row 1
  { row: 1, col: 0, x: 0, y: 1, w: 1.5, label: 'TAB' },
  { row: 1, col: 1, x: 1.5, y: 1, label: 'Q' },
  { row: 1, col: 2, x: 2.5, y: 1, label: 'W' },
  { row: 1, col: 3, x: 3.5, y: 1, label: 'E' },
  { row: 1, col: 4, x: 4.5, y: 1, label: 'R' },
  { row: 1, col: 5, x: 5.5, y: 1, label: 'T' },
  { row: 1, col: 6, x: 6.5, y: 1, label: 'Y' },
  { row: 1, col: 7, x: 7.5, y: 1, label: 'U' },
  { row: 1, col: 8, x: 8.5, y: 1, label: 'I' },
  { row: 1, col: 9, x: 9.5, y: 1, label: 'O' },
  { row: 1, col: 10, x: 10.5, y: 1, label: 'P' },
  { row: 1, col: 11, x: 11.5, y: 1, label: '[' },
  { row: 1, col: 12, x: 12.5, y: 1, label: ']' },
  { row: 1, col: 13, x: 13.5, y: 1, w: 1.5, label: '\\' },
  // Row 2
  { row: 2, col: 0, x: 0, y: 2, w: 1.75, label: 'CAPS' },
  { row: 2, col: 1, x: 1.75, y: 2, label: 'A' },
  { row: 2, col: 2, x: 2.75, y: 2, label: 'S' },
  { row: 2, col: 3, x: 3.75, y: 2, label: 'D' },
  { row: 2, col: 4, x: 4.75, y: 2, label: 'F' },
  { row: 2, col: 5, x: 5.75, y: 2, label: 'G' },
  { row: 2, col: 6, x: 6.75, y: 2, label: 'H' },
  { row: 2, col: 7, x: 7.75, y: 2, label: 'J' },
  { row: 2, col: 8, x: 8.75, y: 2, label: 'K' },
  { row: 2, col: 9, x: 9.75, y: 2, label: 'L' },
  { row: 2, col: 10, x: 10.75, y: 2, label: ';' },
  { row: 2, col: 11, x: 11.75, y: 2, label: "'" },
  { row: 2, col: 12, x: 12.75, y: 2, w: 2.25, label: 'ENTER' },
  // Row 3
  { row: 3, col: 0, x: 0, y: 3, w: 2.25, label: 'SHIFT' },
  { row: 3, col: 1, x: 2.25, y: 3, label: 'Z' },
  { row: 3, col: 2, x: 3.25, y: 3, label: 'X' },
  { row: 3, col: 3, x: 4.25, y: 3, label: 'C' },
  { row: 3, col: 4, x: 5.25, y: 3, label: 'V' },
  { row: 3, col: 5, x: 6.25, y: 3, label: 'B' },
  { row: 3, col: 6, x: 7.25, y: 3, label: 'N' },
  { row: 3, col: 7, x: 8.25, y: 3, label: 'M' },
  { row: 3, col: 8, x: 9.25, y: 3, label: ',' },
  { row: 3, col: 9, x: 10.25, y: 3, label: '.' },
  { row: 3, col: 10, x: 11.25, y: 3, label: '/' },
  { row: 3, col: 11, x: 12.25, y: 3, w: 2.75, label: 'SHIFT' },
  // Row 4
  { row: 4, col: 0, x: 0, y: 4, w: 1.25, label: 'CTRL' },
  { row: 4, col: 1, x: 1.25, y: 4, w: 1.25, label: 'WIN' },
  { row: 4, col: 2, x: 2.5, y: 4, w: 1.25, label: 'ALT' },
  { row: 4, col: 3, x: 3.75, y: 4, w: 6.25, label: 'SPACE' },
  { row: 4, col: 4, x: 10, y: 4, w: 1.25, label: 'ALT' },
  { row: 4, col: 5, x: 11.25, y: 4, w: 1.25, label: 'WIN' },
  { row: 4, col: 6, x: 12.5, y: 4, w: 1.25, label: 'MENU' },
  { row: 4, col: 7, x: 13.75, y: 4, w: 1.25, label: 'CTRL' },
];

interface KeyboardLayoutProps {
  layout?: KeyDefinition[];
  keymap?: Map<string, number>;  // "row,col" -> keycode
  selectedKey?: { row: number; col: number } | null;
  onKeySelect?: (key: KeyDefinition) => void;
  layer?: number;
}

export default function KeyboardLayout({
  layout = LAYOUT_60_ANSI,
  keymap,
  selectedKey,
  onKeySelect,
  layer = 0,
}: KeyboardLayoutProps) {
  const UNIT_SIZE = 40; // pixels per unit
  const GAP = 2;

  const getKeycode = (row: number, col: number): number | undefined => {
    return keymap?.get(`${row},${col}`);
  };

  const isSelected = (key: KeyDefinition): boolean => {
    return selectedKey?.row === key.row && selectedKey?.col === key.col;
  };

  return (
    <div className={styles.keyboard}>
      <div className={styles.layer}>LAYER {layer}</div>
      <div
        className={styles.layout}
        style={{
          width: 15 * UNIT_SIZE + 14 * GAP,
          height: 5 * UNIT_SIZE + 4 * GAP,
        }}
      >
        {layout.map((key) => {
          const width = (key.w || 1) * UNIT_SIZE + ((key.w || 1) - 1) * GAP;
          const height = (key.h || 1) * UNIT_SIZE + ((key.h || 1) - 1) * GAP;
          const keycode = getKeycode(key.row, key.col);
          const displayLabel = keycode !== undefined ? getKeyLabel(keycode) : key.label || '';

          return (
            <button
              key={`${key.row}-${key.col}`}
              className={`${styles.key} ${isSelected(key) ? styles.selected : ''}`}
              style={{
                left: key.x * UNIT_SIZE + key.x * GAP,
                top: key.y * UNIT_SIZE + key.y * GAP,
                width,
                height,
              }}
              onClick={() => onKeySelect?.(key)}
              title={`Row ${key.row}, Col ${key.col}${keycode !== undefined ? ` (0x${keycode.toString(16).toUpperCase()})` : ''}`}
            >
              <span className={styles.label}>{displayLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
