'use client';

import styles from '@components/NumberRangeSlider.module.scss';

import * as React from 'react';

interface RangerProps {
  defaultValue?: number;
  value?: number;
  max?: number;
  min?: number;
  step?: number;
  onChange?: (value: number) => void;
  label?: string;
}

const NumberRangeSlider: React.FC<RangerProps> = ({ defaultValue = 0, value, max = 5000, min = 0, step = 1, onChange, label }) => {
  const sliderRef = React.useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = React.useState<number>(value ?? defaultValue);

  const maxDigits = max.toString().length;

  const padValue = (val: number): string => {
    return val.toString().padStart(maxDigits, '0');
  };

  // Sync with external value prop (controlled mode)
  React.useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(value);
      if (sliderRef.current) {
        sliderRef.current.value = String(value);
      }
    }
  }, [value]);

  // Sync with defaultValue on mount
  React.useEffect(() => {
    if (value === undefined && sliderRef.current) {
      sliderRef.current.value = String(defaultValue);
      setDisplayValue(defaultValue);
    }
  }, [defaultValue, value]);

  const scrub = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = parseInt(event.target.value, 10);
    setDisplayValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={styles.root}>
      {label && <span style={{ marginRight: '8px', flexShrink: 0 }}>{label}</span>}
      <label className={styles.left}>
        <div className={styles.amount}>{padValue(displayValue)}</div>
      </label>
      <input
        className={styles.slider}
        value={value ?? displayValue}
        max={max}
        min={min}
        onChange={scrub}
        ref={sliderRef}
        role="slider"
        step={step}
        tabIndex={0}
        type="range"
      />
    </div>
  );
};

export default NumberRangeSlider;
