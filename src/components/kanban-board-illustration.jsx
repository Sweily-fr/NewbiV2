import React from 'react';

export function KanbanBoardIllustration({ className = '', ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Gradients modernes */}
        <linearGradient
          id="boardGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        <linearGradient
          id="purpleGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#5b50ff" />
        </linearGradient>
        <linearGradient
          id="darkGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <filter
          id="shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="8"
            floodColor="#5b50ff"
            floodOpacity="0.1"
          />
        </filter>
        <filter
          id="cardShadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="4"
            floodColor="#000000"
            floodOpacity="0.1"
          />
        </filter>
      </defs>

      {/* Floating elements background */}
      <circle
        cx="60"
        cy="30"
        r="4"
        fill="url(#purpleGradient)"
        opacity="0.2"
      />
      <circle
        cx="180"
        cy="25"
        r="3"
        fill="url(#darkGradient)"
        opacity="0.15"
      />
      <circle
        cx="200"
        cy="45"
        r="2"
        fill="url(#purpleGradient)"
        opacity="0.3"
      />

      {/* Main board with modern shadow */}
      <rect
        x="20"
        y="40"
        width="200"
        height="120"
        rx="16"
        fill="url(#boardGradient)"
        filter="url(#shadow)"
        stroke="#e2e8f0"
        strokeWidth="1"
      />

      {/* Column 1 - Modern purple */}
      <rect
        x="35"
        y="55"
        width="50"
        height="90"
        rx="12"
        fill="url(#purpleGradient)"
        fillOpacity="0.08"
        stroke="url(#purpleGradient)"
        strokeWidth="1"
      />
      <rect
        x="40"
        y="62"
        width="40"
        height="8"
        rx="4"
        fill="url(#purpleGradient)"
      />
      <rect
        x="40"
        y="76"
        width="40"
        height="24"
        rx="6"
        fill="white"
        filter="url(#cardShadow)"
      />
      <rect
        x="40"
        y="106"
        width="40"
        height="24"
        rx="6"
        fill="white"
        filter="url(#cardShadow)"
      />

      {/* Column 2 - Modern dark */}
      <rect
        x="95"
        y="55"
        width="50"
        height="90"
        rx="12"
        fill="#000000"
        fillOpacity="0.04"
        stroke="url(#darkGradient)"
        strokeWidth="1"
      />
      <rect
        x="100"
        y="62"
        width="40"
        height="8"
        rx="4"
        fill="url(#darkGradient)"
      />
      <rect
        x="100"
        y="76"
        width="40"
        height="24"
        rx="6"
        fill="white"
        filter="url(#cardShadow)"
      />

      {/* Column 3 - Modern purple */}
      <rect
        x="155"
        y="55"
        width="50"
        height="90"
        rx="12"
        fill="url(#purpleGradient)"
        fillOpacity="0.08"
        stroke="url(#purpleGradient)"
        strokeWidth="1"
      />
      <rect
        x="160"
        y="62"
        width="40"
        height="8"
        rx="4"
        fill="url(#purpleGradient)"
      />

      {/* Central floating plus icon */}
      <circle
        cx="120"
        cy="100"
        r="20"
        fill="url(#purpleGradient)"
        fillOpacity="0.1"
        filter="url(#shadow)"
      />
      <circle
        cx="120"
        cy="100"
        r="18"
        fill="none"
        stroke="url(#purpleGradient)"
        strokeWidth="2"
        strokeDasharray="4 4"
        opacity="0.6"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 120 100;360 120 100"
          dur="8s"
          repeatCount="indefinite"
        />
      </circle>
      <path
        d="M112 100h16M120 92v16"
        stroke="url(#purpleGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Floating geometric shapes */}
      <path
        d="M45 35 L55 30 L50 40 Z"
        fill="url(#purpleGradient)"
        opacity="0.2"
      />
      <rect
        x="185"
        y="35"
        width="8"
        height="8"
        rx="2"
        fill="url(#darkGradient)"
        opacity="0.2"
        transform="rotate(45 189 39)"
      />
    </svg>
  );
}
