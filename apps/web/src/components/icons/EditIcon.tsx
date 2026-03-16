'use client';

import type { SVGProps } from 'react';

export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M5 19h4.243a2 2 0 0 0 1.414-.586l7.5-7.5a1.5 1.5 0 0 0 0-2.121L15.207 4.793a1.5 1.5 0 0 0-2.121 0l-7.5 7.5A2 2 0 0 0 5 13.707V19Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 6 18 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

