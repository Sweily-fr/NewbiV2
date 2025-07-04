import React from 'react';

export function EmptySearchIllustration({ className = '', ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Gradients modernes pour recherche */}
        <linearGradient
          id="searchGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#5b50ff" />
        </linearGradient>
        <linearGradient
          id="emptyGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <filter
          id="searchGlow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id="floatShadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="6"
            floodColor="#5b50ff"
            floodOpacity="0.15"
          />
        </filter>
      </defs>

      {/* Floating background elements */}
      <circle
        cx="40"
        cy="30"
        r="3"
        fill="url(#searchGradient)"
        opacity="0.2"
      >
        <animate
          attributeName="cy"
          values="30;25;30"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx="180"
        cy="35"
        r="2"
        fill="url(#searchGradient)"
        opacity="0.3"
      >
        <animate
          attributeName="cy"
          values="35;30;35"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>
      <path
        d="M200 25 L205 20 L210 25 L205 30 Z"
        fill="url(#searchGradient)"
        opacity="0.15"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 205 25;360 205 25"
          dur="6s"
          repeatCount="indefinite"
        />
      </path>

      {/* Modern magnifying glass */}
      <circle
        cx="80"
        cy="65"
        r="28"
        fill="none"
        stroke="url(#searchGradient)"
        strokeWidth="4"
        filter="url(#searchGlow)"
      />
      <circle
        cx="80"
        cy="65"
        r="22"
        fill="url(#searchGradient)"
        fillOpacity="0.05"
      />
      <path
        d="m102 87 18 18"
        stroke="url(#searchGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#searchGlow)"
      />

      {/* Animated search waves */}
      <g opacity="0.6">
        <circle
          cx="80"
          cy="65"
          r="35"
          fill="none"
          stroke="url(#searchGradient)"
          strokeWidth="1"
          opacity="0.4"
        >
          <animate
            attributeName="r"
            values="35;45;35"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;0;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx="80"
          cy="65"
          r="40"
          fill="none"
          stroke="url(#searchGradient)"
          strokeWidth="1"
          opacity="0.2"
        >
          <animate
            attributeName="r"
            values="40;50;40"
            dur="2.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0;0.2"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Question mark with glow */}
      <text
        x="80"
        y="72"
        fill="url(#searchGradient)"
        fontSize="18"
        fontWeight="bold"
        textAnchor="middle"
        filter="url(#searchGlow)"
      >
        ?
      </text>

      {/* Modern empty results */}
      <g opacity="0.25">
        <rect
          x="30"
          y="115"
          width="45"
          height="32"
          rx="8"
          fill="url(#emptyGradient)"
          stroke="#cbd5e1"
          strokeWidth="1"
        />
        <rect
          x="85"
          y="115"
          width="45"
          height="32"
          rx="8"
          fill="url(#emptyGradient)"
          stroke="#cbd5e1"
          strokeWidth="1"
        />
        <rect
          x="140"
          y="115"
          width="45"
          height="32"
          rx="8"
          fill="url(#emptyGradient)"
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {/* Modern cross lines with gradient */}
        <path
          d="M25 110 L80 152"
          stroke="url(#searchGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M80 110 L135 152"
          stroke="url(#searchGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M135 110 L190 152"
          stroke="url(#searchGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>

      {/* Floating geometric elements */}
      <rect
        x="150"
        y="45"
        width="6"
        height="6"
        rx="1"
        fill="url(#searchGradient)"
        opacity="0.3"
        transform="rotate(45 153 48)"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="45 153 48;405 153 48"
          dur="8s"
          repeatCount="indefinite"
        />
      </rect>
      <circle
        cx="160"
        cy="75"
        r="2"
        fill="url(#searchGradient)"
        opacity="0.4"
      >
        <animate
          attributeName="r"
          values="2;3;2"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Search beam effect */}
      <path
        d="M108 65 Q140 50 170 65"
        stroke="url(#searchGradient)"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      >
        <animate
          attributeName="opacity"
          values="0.3;0.6;0.3"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M108 70 Q140 85 170 70"
        stroke="url(#searchGradient)"
        strokeWidth="1"
        fill="none"
        opacity="0.2"
      >
        <animate
          attributeName="opacity"
          values="0.2;0.5;0.2"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
