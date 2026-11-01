// 작은 UI 아이콘 (선 기반)
const p = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

export const IconSun = (props) => (
  <svg {...p} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const IconMoon = (props) => (
  <svg {...p} {...props}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);
export const IconUser = (props) => (
  <svg {...p} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
export const IconArrowRight = (props) => (
  <svg {...p} {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconArrowLeft = (props) => (
  <svg {...p} {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const IconArrowUpRight = (props) => (
  <svg {...p} {...props}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);
export const IconPlay = (props) => (
  <svg {...p} {...props} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" />
  </svg>
);
export const IconClose = (props) => (
  <svg {...p} {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconMail = (props) => (
  <svg {...p} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const IconCopy = (props) => (
  <svg {...p} {...props}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);
export const IconCheck = (props) => (
  <svg {...p} {...props}>
    <path d="m5 12 5 5 9-10" />
  </svg>
);
export const IconExpand = (props) => (
  <svg {...p} {...props}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);
export const IconShrink = (props) => (
  <svg {...p} {...props}>
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
  </svg>
);
export const IconBook = (props) => (
  <svg {...p} {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </svg>
);
export const IconMic = (props) => (
  <svg {...p} {...props}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" />
  </svg>
);
export const IconGamepad = (props) => (
  <svg {...p} {...props}>
    <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
    <path d="M17.3 5H6.7a4 4 0 0 0-4 3.6L2 15a3 3 0 0 0 5.2 2.1L9 15h6l1.8 2.1A3 3 0 0 0 22 15l-.7-6.4A4 4 0 0 0 17.3 5z" />
  </svg>
);
export const IconPen = (props) => (
  <svg {...p} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);
export const IconVideo = (props) => (
  <svg {...p} {...props}>
    <rect x="2" y="5" width="15" height="14" rx="2" />
    <path d="m17 10 5-3v10l-5-3z" />
  </svg>
);
export const IconYouTube = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"
    />
  </svg>
);
