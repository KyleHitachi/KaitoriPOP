"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

interface Option<T> {
  value: T;
  label: string;
  title?: string;
}

interface Props<T> {
  label: string;
  options: Option<T>[];
  // A value outside the options (e.g. a hand-made order) leaves no pill.
  value: T;
  onChange: (value: T) => void;
  trailing?: ReactNode;
}

// Pill group whose solid pill slides to the chosen option.
export default function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  trailing,
}: Props<T>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const activeIndex = options.findIndex((option) => option.value === value);

  useLayoutEffect(() => {
    const place = () => {
      const button = buttonRefs.current[activeIndex];
      setPill(button ? { left: button.offsetLeft, width: button.offsetWidth } : null);
    };
    place();
    // Web fonts can change the button widths after the first paint.
    const observer = new ResizeObserver(place);
    buttonRefs.current.forEach((button) => button && observer.observe(button));
    return () => observer.disconnect();
  }, [activeIndex, options.length]);

  return (
    <div className="ui-seg relative" role="group" aria-label={label}>
      <span
        aria-hidden="true"
        className="ui-seg-pill"
        style={{
          opacity: pill ? 1 : 0,
          width: pill?.width ?? 0,
          transform: `translateX(${pill?.left ?? 0}px)`,
        }}
      />
      {options.map((option, index) => (
        <button
          key={String(option.value)}
          ref={(element) => {
            buttonRefs.current[index] = element;
          }}
          type="button"
          aria-pressed={index === activeIndex}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
      {trailing}
    </div>
  );
}
