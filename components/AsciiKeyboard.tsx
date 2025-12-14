'use client';

import styles from './AsciiKeyboard.module.scss';
import { useRef, useEffect, useState } from 'react';
import { KeyDefinition, LAYOUT_60_ANSI } from './KeyboardLayout';

interface AsciiKeyboardProps {
  layout?: KeyDefinition[];
  pressedKeys?: Set<string>;
}

// Character dimensions for monospace font
const CHAR_WIDTH = 10;
const CHAR_HEIGHT = 18;

// Each keyboard unit = 4 characters wide (to fit labels)
const CHARS_PER_UNIT = 4;
const KEY_HEIGHT_CHARS = 3; // +---+ top, | X | middle, +---+ bottom

export default function AsciiKeyboard({
  layout = LAYOUT_60_ANSI,
  pressedKeys,
}: AsciiKeyboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate grid dimensions based on layout
  const gridWidth = Math.ceil(
    Math.max(...layout.map((k) => (k.x + (k.w || 1)) * CHARS_PER_UNIT)) + 1
  );
  const gridHeight = Math.ceil(
    Math.max(...layout.map((k) => k.y + 1)) * KEY_HEIGHT_CHARS + 1
  );

  // Build the ASCII grid
  const buildGrid = (): { char: string; pressed: boolean }[][] => {
    const grid: { char: string; pressed: boolean }[][] = [];

    // Initialize empty grid
    for (let y = 0; y < gridHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < gridWidth; x++) {
        grid[y][x] = { char: ' ', pressed: false };
      }
    }

    // Draw each key
    for (const key of layout) {
      const isPressed = pressedKeys?.has(`${key.row},${key.col}`) ?? false;
      const startX = Math.round(key.x * CHARS_PER_UNIT);
      const startY = key.y * KEY_HEIGHT_CHARS;
      const keyWidth = Math.round((key.w || 1) * CHARS_PER_UNIT);

      // Get label (use provided label or default)
      const label = key.label || '';
      const displayLabel = label.length > keyWidth - 2 ? label.slice(0, keyWidth - 2) : label;

      // Draw top border: +---+
      for (let x = 0; x < keyWidth; x++) {
        const gx = startX + x;
        if (gx >= gridWidth) continue;

        let char = '-';
        if (x === 0 || x === keyWidth - 1) char = '+';

        grid[startY][gx] = { char, pressed: isPressed };
      }

      // Draw middle row: | X |
      const middleY = startY + 1;
      if (middleY < gridHeight) {
        for (let x = 0; x < keyWidth; x++) {
          const gx = startX + x;
          if (gx >= gridWidth) continue;

          let char = ' ';
          if (x === 0 || x === keyWidth - 1) {
            char = '|';
          }

          grid[middleY][gx] = { char, pressed: isPressed };
        }

        // Center the label
        const labelStart = startX + Math.floor((keyWidth - displayLabel.length) / 2);
        for (let i = 0; i < displayLabel.length; i++) {
          const gx = labelStart + i;
          if (gx > startX && gx < startX + keyWidth - 1 && gx < gridWidth) {
            grid[middleY][gx] = { char: displayLabel[i], pressed: isPressed };
          }
        }
      }

      // Draw bottom border: +---+
      const bottomY = startY + 2;
      if (bottomY < gridHeight) {
        for (let x = 0; x < keyWidth; x++) {
          const gx = startX + x;
          if (gx >= gridWidth) continue;

          let char = '-';
          if (x === 0 || x === keyWidth - 1) char = '+';

          grid[bottomY][gx] = { char, pressed: isPressed };
        }
      }
    }

    return grid;
  };

  // Render to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get theme colors
    const computedStyle = getComputedStyle(document.body);
    const textColor = computedStyle.getPropertyValue('--color-text').trim() || '#ffffff';
    const bgColor = computedStyle.getPropertyValue('--color-background').trim() || '#000000';

    // Set canvas size
    const canvasWidth = gridWidth * CHAR_WIDTH;
    const canvasHeight = gridHeight * CHAR_HEIGHT;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set font
    const fontFamily = computedStyle.getPropertyValue('--font-family-mono').trim() || 'monospace';
    ctx.font = `${CHAR_HEIGHT - 4}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    // Build and render grid
    const grid = buildGrid();

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const cell = grid[y][x];
        if (cell.char === ' ' && !cell.pressed) continue;

        const px = x * CHAR_WIDTH;
        const py = y * CHAR_HEIGHT;

        if (cell.pressed) {
          // Invert colors for pressed keys
          ctx.fillStyle = textColor;
          ctx.fillRect(px, py, CHAR_WIDTH, CHAR_HEIGHT);
          ctx.fillStyle = bgColor;
        } else {
          ctx.fillStyle = textColor;
        }

        if (cell.char !== ' ') {
          ctx.fillText(cell.char, px + 1, py + 2);
        }
      }
    }
  }, [layout, pressedKeys, gridWidth, gridHeight]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
