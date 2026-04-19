import type { ComponentPropsWithoutRef } from "react";

export default function EyeOffIcon(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5"
      {...props}
    >
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 6.2C11.1 6.1 11.5 6 12 6C16.6 6 20.1 8.5 22 12C21.1 13.6 19.8 15 18.3 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 8.3C4.7 9.2 3.5 10.5 2.8 12C4.7 15.5 8.1 18 12 18C13.5 18 14.8 17.6 16 16.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.1 14.1C13.6 14.6 12.8 15 12 15C10.3 15 9 13.7 9 12C9 11.2 9.4 10.4 9.9 9.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
