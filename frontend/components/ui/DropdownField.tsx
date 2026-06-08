"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/components/ui/icons";

interface DropdownFieldProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export default function DropdownField<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: DropdownFieldProps<T>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <div ref={menuRef} className="relative">
      <label className="mb-1 block text-xs font-semibold text-[#21412f]">{label}</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={`dropdown-clean disabled:cursor-not-allowed disabled:opacity-70 ${isOpen ? "dropdown-clean-open" : ""}`}
      >
        <span className="text-[#1f3b2d]">{selectedLabel}</span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`dropdown-option ${value === option.value ? "dropdown-option-selected" : ""}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
