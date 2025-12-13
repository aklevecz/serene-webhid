'use client';

import { useState } from 'react';
import styles from './KeyPicker.module.scss';
import { KEYCODES, getKeyLabel } from '@common/via';
import Accordion from '@components/Accordion';
import Card from '@components/Card';

interface KeycodeGroup {
  name: string;
  keys: { code: number; label: string }[];
}

const KEYCODE_GROUPS: KeycodeGroup[] = [
  {
    name: 'LETTERS',
    keys: [
      { code: KEYCODES.KC_A, label: 'A' },
      { code: KEYCODES.KC_B, label: 'B' },
      { code: KEYCODES.KC_C, label: 'C' },
      { code: KEYCODES.KC_D, label: 'D' },
      { code: KEYCODES.KC_E, label: 'E' },
      { code: KEYCODES.KC_F, label: 'F' },
      { code: KEYCODES.KC_G, label: 'G' },
      { code: KEYCODES.KC_H, label: 'H' },
      { code: KEYCODES.KC_I, label: 'I' },
      { code: KEYCODES.KC_J, label: 'J' },
      { code: KEYCODES.KC_K, label: 'K' },
      { code: KEYCODES.KC_L, label: 'L' },
      { code: KEYCODES.KC_M, label: 'M' },
      { code: KEYCODES.KC_N, label: 'N' },
      { code: KEYCODES.KC_O, label: 'O' },
      { code: KEYCODES.KC_P, label: 'P' },
      { code: KEYCODES.KC_Q, label: 'Q' },
      { code: KEYCODES.KC_R, label: 'R' },
      { code: KEYCODES.KC_S, label: 'S' },
      { code: KEYCODES.KC_T, label: 'T' },
      { code: KEYCODES.KC_U, label: 'U' },
      { code: KEYCODES.KC_V, label: 'V' },
      { code: KEYCODES.KC_W, label: 'W' },
      { code: KEYCODES.KC_X, label: 'X' },
      { code: KEYCODES.KC_Y, label: 'Y' },
      { code: KEYCODES.KC_Z, label: 'Z' },
    ],
  },
  {
    name: 'NUMBERS',
    keys: [
      { code: KEYCODES.KC_1, label: '1' },
      { code: KEYCODES.KC_2, label: '2' },
      { code: KEYCODES.KC_3, label: '3' },
      { code: KEYCODES.KC_4, label: '4' },
      { code: KEYCODES.KC_5, label: '5' },
      { code: KEYCODES.KC_6, label: '6' },
      { code: KEYCODES.KC_7, label: '7' },
      { code: KEYCODES.KC_8, label: '8' },
      { code: KEYCODES.KC_9, label: '9' },
      { code: KEYCODES.KC_0, label: '0' },
    ],
  },
  {
    name: 'FUNCTION',
    keys: [
      { code: KEYCODES.KC_F1, label: 'F1' },
      { code: KEYCODES.KC_F2, label: 'F2' },
      { code: KEYCODES.KC_F3, label: 'F3' },
      { code: KEYCODES.KC_F4, label: 'F4' },
      { code: KEYCODES.KC_F5, label: 'F5' },
      { code: KEYCODES.KC_F6, label: 'F6' },
      { code: KEYCODES.KC_F7, label: 'F7' },
      { code: KEYCODES.KC_F8, label: 'F8' },
      { code: KEYCODES.KC_F9, label: 'F9' },
      { code: KEYCODES.KC_F10, label: 'F10' },
      { code: KEYCODES.KC_F11, label: 'F11' },
      { code: KEYCODES.KC_F12, label: 'F12' },
    ],
  },
  {
    name: 'MODIFIERS',
    keys: [
      { code: KEYCODES.KC_LEFT_CTRL, label: 'L CTRL' },
      { code: KEYCODES.KC_LEFT_SHIFT, label: 'L SHIFT' },
      { code: KEYCODES.KC_LEFT_ALT, label: 'L ALT' },
      { code: KEYCODES.KC_LEFT_GUI, label: 'L GUI' },
      { code: KEYCODES.KC_RIGHT_CTRL, label: 'R CTRL' },
      { code: KEYCODES.KC_RIGHT_SHIFT, label: 'R SHIFT' },
      { code: KEYCODES.KC_RIGHT_ALT, label: 'R ALT' },
      { code: KEYCODES.KC_RIGHT_GUI, label: 'R GUI' },
    ],
  },
  {
    name: 'NAVIGATION',
    keys: [
      { code: KEYCODES.KC_UP, label: 'UP' },
      { code: KEYCODES.KC_DOWN, label: 'DOWN' },
      { code: KEYCODES.KC_LEFT, label: 'LEFT' },
      { code: KEYCODES.KC_RIGHT, label: 'RIGHT' },
      { code: KEYCODES.KC_HOME, label: 'HOME' },
      { code: KEYCODES.KC_END, label: 'END' },
      { code: KEYCODES.KC_PAGE_UP, label: 'PG UP' },
      { code: KEYCODES.KC_PAGE_DOWN, label: 'PG DN' },
      { code: KEYCODES.KC_INSERT, label: 'INS' },
      { code: KEYCODES.KC_DELETE, label: 'DEL' },
    ],
  },
  {
    name: 'SPECIAL',
    keys: [
      { code: KEYCODES.KC_ESCAPE, label: 'ESC' },
      { code: KEYCODES.KC_TAB, label: 'TAB' },
      { code: KEYCODES.KC_CAPS_LOCK, label: 'CAPS' },
      { code: KEYCODES.KC_ENTER, label: 'ENTER' },
      { code: KEYCODES.KC_BACKSPACE, label: 'BKSP' },
      { code: KEYCODES.KC_SPACE, label: 'SPACE' },
      { code: KEYCODES.KC_PRINT_SCREEN, label: 'PRTSC' },
      { code: KEYCODES.KC_SCROLL_LOCK, label: 'SCRLK' },
      { code: KEYCODES.KC_PAUSE, label: 'PAUSE' },
    ],
  },
  {
    name: 'SYMBOLS',
    keys: [
      { code: KEYCODES.KC_GRAVE, label: '`' },
      { code: KEYCODES.KC_MINUS, label: '-' },
      { code: KEYCODES.KC_EQUAL, label: '=' },
      { code: KEYCODES.KC_LEFT_BRACKET, label: '[' },
      { code: KEYCODES.KC_RIGHT_BRACKET, label: ']' },
      { code: KEYCODES.KC_BACKSLASH, label: '\\' },
      { code: KEYCODES.KC_SEMICOLON, label: ';' },
      { code: KEYCODES.KC_QUOTE, label: "'" },
      { code: KEYCODES.KC_COMMA, label: ',' },
      { code: KEYCODES.KC_DOT, label: '.' },
      { code: KEYCODES.KC_SLASH, label: '/' },
    ],
  },
  {
    name: 'MEDIA',
    keys: [
      { code: KEYCODES.KC_MUTE, label: 'MUTE' },
      { code: KEYCODES.KC_VOL_UP, label: 'VOL+' },
      { code: KEYCODES.KC_VOL_DOWN, label: 'VOL-' },
      { code: KEYCODES.KC_MEDIA_PLAY_PAUSE, label: 'PLAY' },
      { code: KEYCODES.KC_MEDIA_NEXT_TRACK, label: 'NEXT' },
      { code: KEYCODES.KC_MEDIA_PREV_TRACK, label: 'PREV' },
    ],
  },
  {
    name: 'LAYERS',
    keys: [
      { code: KEYCODES.MO_0, label: 'MO(0)' },
      { code: KEYCODES.MO_1, label: 'MO(1)' },
      { code: KEYCODES.MO_2, label: 'MO(2)' },
      { code: KEYCODES.MO_3, label: 'MO(3)' },
      { code: KEYCODES.TG_0, label: 'TG(0)' },
      { code: KEYCODES.TG_1, label: 'TG(1)' },
      { code: KEYCODES.TG_2, label: 'TG(2)' },
      { code: KEYCODES.TG_3, label: 'TG(3)' },
    ],
  },
  {
    name: 'SPECIAL CODES',
    keys: [
      { code: KEYCODES.KC_NO, label: 'NONE' },
      { code: KEYCODES.KC_TRANSPARENT, label: 'TRANS' },
    ],
  },
];

interface KeyPickerProps {
  selectedKeycode?: number;
  onSelect: (keycode: number) => void;
}

export default function KeyPicker({ selectedKeycode, onSelect }: KeyPickerProps) {
  return (
    <div className={styles.picker}>
      {KEYCODE_GROUPS.map((group) => (
        <Accordion key={group.name} defaultValue={group.name === 'LETTERS'} title={group.name}>
          <div className={styles.grid}>
            {group.keys.map((key) => (
              <button
                key={key.code}
                className={`${styles.keyButton} ${selectedKeycode === key.code ? styles.selected : ''}`}
                onClick={() => onSelect(key.code)}
                title={`0x${key.code.toString(16).toUpperCase()}`}
              >
                {key.label}
              </button>
            ))}
          </div>
        </Accordion>
      ))}
    </div>
  );
}
