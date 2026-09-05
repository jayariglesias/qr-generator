'use client';

import styles from './generator-screen.module.css';

type ChoiceProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
};

export default function Choices<T extends string>({
  value,
  onChange,
  options,
}: ChoiceProps<T>) {
  return (
    <div className={styles.choices}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.choice} ${value === option.value ? styles.choiceActive : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
