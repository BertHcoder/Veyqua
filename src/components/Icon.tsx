const PATHS = {
  home: 'M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5',
  book: 'M2 5c3-1.2 7-1.2 10 1 3-2.2 7-2.2 10-1v14c-3-1-7-1-10 1-3-2-7-2-10-1zM12 6v14',
  settings: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  plus: 'M12 5v14M5 12h14',
  test: 'M8.5 3h7M10 3v14a2 2 0 0 0 4 0V3M10 11h4',
  chart: 'M4 4v16h16M7.5 15l3.5-4.5 3 3L19 7',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  fish: 'M2.5 12c2.5-4 8-6.5 13-3l4-3v12l-4-3c-5 3.5-10.5 1-13-3zM7.5 11.2h.01',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  trash: 'M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v5M14 11v5',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 15V4M7 9l5-5 5 5M5 20h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M12 3.5l9.5 16.5h-19zM12 10v4.5M12 17.2h.01',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5.5M12 7.8h.01',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  drop: 'M12 3c3.5 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 2.5-6.5 6-11z',
  wave: 'M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  sparkle: 'M12 3v5M12 16v5M3 12h5M16 12h5M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9',
  pill: 'M10.6 4.6a5 5 0 0 1 7.1 7.1l-6 6a5 5 0 0 1-7.1-7.1zM7.6 7.6l8.8 8.8',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3.5 2',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  leaf: 'M5 19C5 10 11 5 20 4c0 9-5 15-14 15zM5 19l7-7',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
