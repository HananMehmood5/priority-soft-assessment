'use client';

import type { SVGProps } from 'react';

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 3a5 5 0 0 0-5 5v3.586l-.707.707A1 1 0 0 0 7 14.707h10a1 1 0 0 0 .707-1.707L17 11.586V8a5 5 0 0 0-5-5Zm0 18a3 3 0 0 0 2.995-2.824L15 18h-6a3 3 0 0 0 2.824 2.995L12 21Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

