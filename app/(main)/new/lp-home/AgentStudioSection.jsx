"use client";
import React from "react";

// SVG Icons
const UserIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="size-4 text-white"
  >
    <path
      d="M2.95697 12.7C2.88417 12.7 2.81047 12.6897 2.73777 12.6673C1.99557 12.4412 1.49707 11.7723 1.49707 11.0027V2.75858C1.49707 2.19218 1.77298 1.65898 2.23538 1.33278C2.69828 1.00608 3.29247 0.926586 3.82567 1.11358C7.25727 2.33088 10.7378 2.33138 14.1685 1.11308C14.7017 0.924586 15.2963 1.00568 15.7587 1.33228C16.2212 1.65848 16.497 2.19168 16.497 2.75758V11.0032C16.497 11.7732 15.9985 12.4422 15.2558 12.6678C14.8598 12.7884 14.4409 12.5643 14.3203 12.1678C14.2002 11.7713 14.4239 11.3529 14.8203 11.2323C14.9018 11.2079 14.9972 11.1327 14.9972 11.0033V2.75758C14.9972 2.64718 14.9323 2.58468 14.8937 2.55738C14.8551 2.53008 14.7746 2.48808 14.6706 2.52708C10.906 3.86208 7.08807 3.86158 3.32437 2.52758C3.21887 2.49048 3.13887 2.53048 3.10077 2.55788C3.06217 2.58518 2.99727 2.64768 2.99727 2.75858V11.0027C2.99727 11.1321 3.09347 11.2073 3.17547 11.2327C3.57147 11.3533 3.79507 11.7723 3.67397 12.1687C3.57537 12.4919 3.27827 12.7 2.95697 12.7Z"
      fill="currentColor"
    ></path>
    <path
      d="M8.99902 9.5C10.2416 9.5 11.249 8.49264 11.249 7.25C11.249 6.00736 10.2416 5 8.99902 5C7.75638 5 6.74902 6.00736 6.74902 7.25C6.74902 8.49264 7.75638 9.5 8.99902 9.5Z"
      fill="currentColor"
    ></path>
    <path
      d="M13.4606 14.5661C13.0055 12.5002 11.1291 11.0012 8.99821 11.0012C6.86731 11.0012 4.99091 12.5002 4.53581 14.5666C4.35171 15.405 4.87561 16.2634 5.72871 16.5207C6.78831 16.8395 7.88841 17.0012 8.99821 17.0012C10.1037 17.0012 11.2033 16.8396 12.2672 16.5207C13.1212 16.2639 13.6451 15.4055 13.4606 14.5661Z"
      fill="currentColor"
    ></path>
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="size-4"
  >
    <path
      d="M11.6791 8.62055L10.7404 8.51654L10.3093 7.47478L10.8996 6.73701C11.1724 6.39567 11.1458 5.90322 10.8356 5.59389L10.4044 5.16278C10.0951 4.85256 9.60267 4.82588 9.26133 5.09877L8.52356 5.68899L7.48089 5.2579L7.376 4.31923C7.32711 3.88367 6.96 3.55566 6.52267 3.55566H5.92C5.48267 3.55566 5.11556 3.88456 5.06667 4.31923L4.96178 5.2579L3.91911 5.68899L3.18132 5.09877C2.83999 4.82588 2.34756 4.85256 2.03822 5.16278L1.60711 5.59389C1.29778 5.90322 1.27021 6.39567 1.5431 6.73701L2.13332 7.47478L1.70221 8.51654L0.76355 8.62055C0.327995 8.66944 0 9.03744 0 9.47389V10.0828C0 10.5201 0.328884 10.8872 0.76355 10.9361L1.70221 11.0401L2.13332 12.0819L1.5431 12.8197C1.27021 13.161 1.29689 13.6534 1.60711 13.9628L2.03822 14.3939C2.34756 14.7041 2.83999 14.7308 3.18132 14.4579L3.91911 13.8677L4.96178 14.2988L5.06667 15.2374C5.11556 15.673 5.48267 16.001 5.92 16.001H6.52267C6.96 16.001 7.32711 15.6721 7.376 15.2374L7.48089 14.2988L8.52356 13.8677L9.26133 14.4579C9.60267 14.7308 10.0951 14.7041 10.4044 14.3939L10.8356 13.9628C11.1449 13.6534 11.1724 13.161 10.8996 12.8197L10.3093 12.0819L10.7404 11.0401L11.6791 10.9361C12.1147 10.8872 12.4427 10.5192 12.4427 10.0828V9.47389C12.4427 9.03655 12.1138 8.66944 11.6791 8.62055ZM6.22222 11.5557C5.24 11.5557 4.44444 10.7592 4.44444 9.77789C4.44444 8.79655 5.24 8.00011 6.22222 8.00011C7.20444 8.00011 8 8.79655 8 9.77789C8 10.7592 7.20444 11.5557 6.22222 11.5557Z"
      fill="white"
    ></path>
    <path
      d="M14.1271 9.13679C13.956 9.13679 13.785 9.07128 13.6549 8.94061C13.4006 8.68498 13.3962 8.2744 13.641 8.01351L13.2113 7.47705C13.0594 7.28736 13.023 7.02959 13.1168 6.80515L13.4406 6.02389C13.5335 5.79954 13.7409 5.64328 13.9823 5.61635L14.6854 5.53822L14.6671 5.10159L13.9839 5.04861C13.7426 5.02168 13.5352 4.86541 13.4423 4.64106L13.1184 3.85981C13.0247 3.63545 13.0611 3.37759 13.213 3.1879L13.6557 2.63493L13.3336 2.34196L12.8128 2.78727C12.6227 2.93874 12.3658 2.97607 12.1409 2.88229L11.3597 2.55892C11.1357 2.46603 10.9795 2.25856 10.9526 2.01723L10.8736 1.31323L10.4395 1.33323L10.3831 2.01723C10.3561 2.25856 10.1999 2.46603 9.97595 2.55892L9.19471 2.88229C8.97071 2.97563 8.71289 2.93874 8.52276 2.78727L7.96978 2.34461C7.71023 2.60461 7.30134 2.60204 7.04187 2.34115C6.78232 2.0799 6.79886 1.65714 7.0601 1.39803C7.53406 0.927539 8.28321 0.886743 8.80401 1.30425L9.04795 1.5L9.10173 1.47787L9.13728 1.16487C9.21106 0.500787 9.77097 0 10.4393 0H10.896C11.5661 0 12.126 0.501777 12.198 1.16667L12.2336 1.47787L12.2873 1.5L12.5321 1.30336C13.0521 0.885848 13.8012 0.925779 14.276 1.39885L14.6007 1.7239C15.072 2.19528 15.1136 2.9448 14.6979 3.46693L14.5 3.71341L14.5225 3.76638L14.8351 3.80116C15.4991 3.87582 16 4.43573 16 5.10408V5.56071C15.9965 6.23085 15.4947 6.78941 14.8324 6.86364L14.5207 6.89795L14.4982 6.95136L14.6952 7.19661C15.1136 7.71964 15.0711 8.47004 14.5971 8.9423C14.4669 9.07208 14.2972 9.13679 14.1271 9.13679Z"
      fill="white"
    ></path>
  </svg>
);

const FileIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="size-4"
  >
    <g clipPath="url(#clip0_6_1147)">
      <path
        d="M11.1117 14.0003V13.778H10.8894C9.78632 13.778 8.88943 12.8812 8.88943 11.778C8.88943 10.6749 9.78632 9.77805 10.8894 9.77805H11.1117V9.55583C11.1117 8.45272 12.0085 7.55583 13.1117 7.55583C13.5223 7.55583 13.9045 7.68116 14.2228 7.89449V5.92383C14.2228 5.50872 14.061 5.1176 13.7668 4.82427L10.2877 1.34516C9.99343 1.05094 9.60321 0.88916 9.1881 0.88916H4.22276C2.87432 0.88916 1.77832 1.98516 1.77832 3.3336V12.6669C1.77832 14.0154 2.87432 15.1114 4.22276 15.1114H11.4503C11.237 14.7932 11.1117 14.4109 11.1117 14.0003ZM9.33388 2.29272C9.34188 2.28916 9.33743 2.29183 9.34543 2.28827L12.8317 5.7736C12.8317 5.7736 12.8308 5.77627 12.8299 5.77805H10.2237C9.73477 5.77805 9.33476 5.37805 9.33476 4.88916V2.29272H9.33388ZM5.11165 5.3336H6.88943C7.25743 5.3336 7.5561 5.63227 7.5561 6.00027C7.5561 6.36827 7.25743 6.66694 6.88943 6.66694H5.11165C4.74365 6.66694 4.44499 6.36827 4.44499 6.00027C4.44499 5.63227 4.74365 5.3336 5.11165 5.3336ZM4.44499 8.66694C4.44499 8.29894 4.74365 8.00027 5.11165 8.00027H9.11165C9.47965 8.00027 9.77832 8.29894 9.77832 8.66694C9.77832 9.03494 9.47965 9.3336 9.11165 9.3336H5.11165C4.74365 9.3336 4.44499 9.03494 4.44499 8.66694Z"
        fill="white"
      ></path>
      <path
        d="M15.3338 11.1114H13.7782V9.55583C13.7782 9.18783 13.4795 8.88916 13.1115 8.88916C12.7435 8.88916 12.4449 9.18783 12.4449 9.55583V11.1114H10.8893C10.5213 11.1114 10.2227 11.41 10.2227 11.778C10.2227 12.146 10.5213 12.4447 10.8893 12.4447H12.4449V14.0003C12.4449 14.3683 12.7435 14.6669 13.1115 14.6669C13.4795 14.6669 13.7782 14.3683 13.7782 14.0003V12.4447H15.3338C15.7018 12.4447 16.0004 12.146 16.0004 11.778C16.0004 11.41 15.7018 11.1114 15.3338 11.1114Z"
        fill="white"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_6_1147">
        <rect width="16" height="16" fill="white"></rect>
      </clipPath>
    </defs>
  </svg>
);

const SalesforceIcon = () => (
  <svg
    width="15"
    height="10"
    viewBox="0 0 15 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="size-3"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.94348 1.08897C6.40431 0.609254 7.04568 0.312185 7.75424 0.312185C8.69899 0.312185 9.51776 0.837042 9.95864 1.61908C10.35 1.44413 10.7739 1.35381 11.2026 1.35403C12.9031 1.35403 14.2835 2.7449 14.2835 4.46118C14.2835 6.17746 12.9031 7.56834 11.2026 7.56834C10.9947 7.56834 10.7921 7.54745 10.5937 7.50798C10.2079 8.19554 9.47052 8.66266 8.63075 8.66266C8.28885 8.66334 7.95133 8.58578 7.64402 8.43593C7.253 9.35443 6.34238 10 5.28216 10C4.17471 10 3.23522 9.30194 2.87307 8.32046C2.71188 8.35447 2.54759 8.37157 2.38285 8.37147C1.06546 8.37147 0 7.29027 0 5.96238C0 5.07012 0.479719 4.29333 1.19143 3.87345C1.04044 3.52562 0.962718 3.15043 0.963113 2.77125C0.963113 1.23866 2.20702 0 3.73961 0C4.63711 0 5.44015 0.427759 5.94401 1.0917"
      fill="#00A1E0"
    ></path>
  </svg>
);

const HubspotIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="size-3"
  >
    <path
      d="M7.61726 3.29259V2.10176C7.77462 2.02822 7.90786 1.91149 8.00146 1.76516C8.09507 1.61884 8.14519 1.44894 8.14599 1.27524V1.24789C8.14599 0.741441 7.73543 0.330879 7.22898 0.330879H7.20163C6.95842 0.330879 6.72518 0.427493 6.55321 0.599465C6.38123 0.771438 6.28462 1.00468 6.28462 1.24789V1.27524C6.28542 1.44894 6.33554 1.61884 6.42915 1.76516C6.52275 1.91149 6.65599 2.02822 6.81335 2.10176V3.29259C6.36108 3.36184 5.93513 3.54937 5.57863 3.83618L2.31271 1.29246C2.33601 1.20839 2.34816 1.12195 2.34951 1.03518C2.34991 0.830814 2.28969 0.630919 2.17647 0.46078C2.06325 0.290642 1.90212 0.157904 1.71345 0.0793569C1.52478 0.000809612 1.31705 -0.0200182 1.11654 0.0195079C0.91603 0.059034 0.731748 0.157138 0.587002 0.301412C0.442257 0.445685 0.343551 0.629645 0.303369 0.830024C0.263188 1.0304 0.283338 1.2382 0.361268 1.42712C0.439198 1.61605 0.571407 1.77762 0.741174 1.89139C0.910942 2.00517 1.11064 2.06604 1.31501 2.06631C1.4938 2.06547 1.66924 2.01774 1.82382 1.92788L5.03977 4.43041C4.75087 4.86686 4.60015 5.38022 4.60725 5.90357C4.61436 6.42692 4.77896 6.936 5.07961 7.36444L4.10149 8.3429C4.02242 8.31761 3.94004 8.30419 3.85704 8.30306C3.68929 8.30319 3.52534 8.35305 3.38591 8.44633C3.24648 8.53962 3.13784 8.67214 3.0737 8.82715C3.00957 8.98215 2.99282 9.1527 3.02558 9.31722C3.05834 9.48175 3.13914 9.63287 3.25776 9.75149C3.37638 9.87011 3.5275 9.9509 3.69202 9.98366C3.85655 10.0164 4.02709 9.99968 4.1821 9.93554C4.33711 9.87141 4.46963 9.76276 4.56291 9.62333C4.6562 9.48391 4.70605 9.31996 4.70619 9.1522C4.7051 9.0692 4.69167 8.98681 4.66635 8.90776L5.634 7.93977C5.94955 8.18269 6.31651 8.35017 6.70678 8.42937C7.09705 8.50857 7.50027 8.49739 7.88555 8.39668C8.27083 8.29597 8.62795 8.10841 8.92955 7.84837C9.23114 7.58832 9.46921 7.2627 9.62552 6.89643C9.78183 6.53016 9.85223 6.13298 9.83133 5.7353C9.81042 5.33763 9.69877 4.95001 9.50492 4.60215C9.31108 4.25429 9.04018 3.95542 8.71298 3.72843C8.38579 3.50144 8.01097 3.35235 7.61726 3.29259ZM7.21615 7.20913C7.03731 7.21405 6.85931 7.18308 6.69265 7.11804C6.52599 7.053 6.37405 6.95522 6.24582 6.83047C6.11759 6.70571 6.01567 6.55653 5.94607 6.39172C5.87647 6.22691 5.84062 6.04982 5.84062 5.87092C5.84062 5.69202 5.87647 5.51493 5.94607 5.35013C6.01567 5.18532 6.11759 5.03613 6.24582 4.91138C6.37405 4.78663 6.52599 4.68885 6.69265 4.62381C6.85931 4.55877 7.03731 4.5278 7.21615 4.53272C7.56275 4.54485 7.89113 4.69103 8.1321 4.94046C8.37307 5.1899 8.50784 5.52311 8.50801 5.86993C8.50819 6.21675 8.37375 6.55011 8.13303 6.79978C7.89231 7.04946 7.56409 7.19597 7.2175 7.20845"
      fill="#FF7A59"
    ></path>
  </svg>
);

const SheetsIcon = () => (
  <svg
    width="9"
    height="10"
    viewBox="0 0 9 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="size-3"
  >
    <mask
      id="mask0_6_1165"
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="9"
      height="10"
      style={{ maskType: "luminance" }}
    >
      <path
        d="M5.3832 0.148682H1.63009C1.26581 0.148682 0.967773 0.446723 0.967773 0.810995V9.2003C0.967773 9.56457 1.26581 9.86261 1.63009 9.86261H7.37014C7.73441 9.86261 8.03245 9.56457 8.03245 9.2003V2.79794L5.3832 0.148682Z"
        fill="white"
      ></path>
    </mask>
    <g mask="url(#mask0_6_1165)">
      <path
        d="M5.38222 0.147949H1.62911C1.26484 0.147949 0.966797 0.44599 0.966797 0.810263V9.19957C0.966797 9.56384 1.26484 9.86188 1.62911 9.86188H7.36916C7.73343 9.86188 8.03147 9.56384 8.03147 9.19957V2.7972L6.48608 1.69335L5.38222 0.147949Z"
        fill="#0F9D58"
      ></path>
    </g>
    <g mask="url(#mask0_6_1165)">
      <path
        d="M2.7334 4.89478V8.09596H6.26574V4.89478H2.7334ZM4.2788 7.65441H3.17494V7.10249H4.2788V7.65441ZM4.2788 6.77133H3.17494V6.2194H4.2788V6.77133ZM4.2788 5.88825H3.17494V5.33632H4.2788V5.88825ZM5.82419 7.65441H4.72034V7.10249H5.82419V7.65441ZM5.82419 6.77133H4.72034V6.2194H5.82419V6.77133ZM5.82419 5.88825H4.72034V5.33632H5.82419V5.88825Z"
        fill="#F1F1F1"
      ></path>
    </g>
  </svg>
);

const WorkflowIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.75 16.498C14.3734 16.498 16.5 14.3714 16.5 11.748C16.5 9.1247 14.3734 6.99805 11.75 6.99805C9.12665 6.99805 7 9.1247 7 11.748C7 14.3714 9.12665 16.498 11.75 16.498Z"
      fill="currentColor"
    ></path>
    <path
      d="M14.751 6.49707C14.6543 6.49707 14.5567 6.47844 14.4639 6.43994C14.1836 6.32374 14.001 6.05037 14.001 5.74707V4.24707C14.001 3.28227 13.2158 2.49707 12.251 2.49707H11.751C11.3369 2.49707 11.001 2.16117 11.001 1.74707C11.001 1.33297 11.3369 0.99707 11.751 0.99707H12.251C13.9424 0.99707 15.3369 2.29641 15.4873 3.94971L15.9707 3.4668C16.2637 3.1738 16.7383 3.1738 17.0312 3.4668C17.3241 3.7598 17.3242 4.23432 17.0312 4.52722L15.2812 6.27722C15.1376 6.42082 14.9463 6.49707 14.751 6.49707Z"
      fill="currentColor"
    ></path>
    <path
      d="M6.25284 16.9983H5.75284C4.06144 16.9983 2.66694 15.6989 2.51654 14.0456L2.03315 14.5285C1.74015 14.8215 1.26554 14.8215 0.972642 14.5285C0.679742 14.2355 0.679642 13.761 0.972642 13.4681L2.72264 11.7181C2.93744 11.5033 3.26074 11.4388 3.54004 11.5555C3.82034 11.6717 4.00293 11.9451 4.00293 12.2484V13.7484C4.00293 14.7132 4.78813 15.4984 5.75293 15.4984H6.25293C6.66703 15.4984 7.00293 15.8343 7.00293 16.2484C7.00293 16.6625 6.66694 16.9983 6.25284 16.9983Z"
      fill="currentColor"
    ></path>
    <path
      d="M4.97454 10.7593C4.89544 10.7593 4.81433 10.7466 4.73433 10.7197C2.79883 10.0654 1.49805 8.26759 1.49805 6.24609C1.49805 3.62699 3.62894 1.49609 6.24804 1.49609C8.26954 1.49609 10.0673 2.79691 10.7226 4.73291C10.8544 5.12551 10.6445 5.55079 10.2519 5.68359C9.85644 5.81639 9.43454 5.60548 9.30074 5.21338C8.85254 3.88718 7.62594 2.99609 6.24804 2.99609C4.45604 2.99609 2.99805 4.45409 2.99805 6.24609C2.99805 7.62399 3.88863 8.85062 5.21483 9.29882C5.60743 9.43112 5.81734 9.85691 5.68554 10.2495C5.57914 10.562 5.28704 10.7593 4.97454 10.7593Z"
      fill="currentColor"
    ></path>
  </svg>
);

const IntegrationIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.00098 3.60068V2.70068"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M7.19687 12.6008L6.29688 15.3008"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M10.7969 12.6008L11.6969 15.3008"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M9.0041 10.3507C8.63141 10.3507 8.3291 10.0484 8.3291 9.67573V6.30073C8.3291 5.92804 8.63141 5.62573 9.0041 5.62573C9.37679 5.62573 9.6791 5.92804 9.6791 6.30073V9.67573C9.6791 10.0484 9.37679 10.3507 9.0041 10.3507Z"
      fill="currentColor"
    ></path>
    <path
      d="M6.52559 10.3508C6.1529 10.3508 5.85059 10.0485 5.85059 9.67583V8.77583C5.85059 8.40314 6.1529 8.10083 6.52559 8.10083C6.89828 8.10083 7.20059 8.40314 7.20059 8.77583V9.67583C7.20059 10.0485 6.89828 10.3508 6.52559 10.3508Z"
      fill="currentColor"
    ></path>
    <path
      d="M11.4719 10.3507C11.0992 10.3507 10.7969 10.0484 10.7969 9.67568V7.87568C10.7969 7.50299 11.0992 7.20068 11.4719 7.20068C11.8446 7.20068 12.1469 7.50299 12.1469 7.87568V9.67568C12.1469 10.0484 11.8446 10.3507 11.4719 10.3507Z"
      fill="currentColor"
    ></path>
    <path
      d="M12.6041 3.60083H5.4041C3.91293 3.60083 2.7041 4.80966 2.7041 6.30083V9.90083C2.7041 11.392 3.91293 12.6008 5.4041 12.6008H12.6041C14.0953 12.6008 15.3041 11.392 15.3041 9.90083V6.30083C15.3041 4.80966 14.0953 3.60083 12.6041 3.60083Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

const HumanIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.95697 12.7C2.88417 12.7 2.81047 12.6897 2.73777 12.6673C1.99557 12.4412 1.49707 11.7723 1.49707 11.0027V2.75858C1.49707 2.19218 1.77298 1.65898 2.23538 1.33278C2.69828 1.00608 3.29247 0.926586 3.82567 1.11358C7.25727 2.33088 10.7378 2.33138 14.1685 1.11308C14.7017 0.924586 15.2963 1.00568 15.7587 1.33228C16.2212 1.65848 16.497 2.19168 16.497 2.75758V11.0032C16.497 11.7732 15.9985 12.4422 15.2558 12.6678C14.8598 12.7884 14.4409 12.5643 14.3203 12.1678C14.2002 11.7713 14.4239 11.3529 14.8203 11.2323C14.9018 11.2079 14.9972 11.1327 14.9972 11.0033V2.75758C14.9972 2.64718 14.9323 2.58468 14.8937 2.55738C14.8551 2.53008 14.7746 2.48808 14.6706 2.52708C10.906 3.86208 7.08807 3.86158 3.32437 2.52758C3.21887 2.49048 3.13887 2.53048 3.10077 2.55788C3.06217 2.58518 2.99727 2.64768 2.99727 2.75858V11.0027C2.99727 11.1321 3.09347 11.2073 3.17547 11.2327C3.57147 11.3533 3.79507 11.7723 3.67397 12.1687C3.57537 12.4919 3.27827 12.7 2.95697 12.7Z"
      fill="currentColor"
    ></path>
    <path
      d="M8.99902 9.5C10.2416 9.5 11.249 8.49264 11.249 7.25C11.249 6.00736 10.2416 5 8.99902 5C7.75638 5 6.74902 6.00736 6.74902 7.25C6.74902 8.49264 7.75638 9.5 8.99902 9.5Z"
      fill="currentColor"
    ></path>
    <path
      d="M13.4606 14.5661C13.0055 12.5002 11.1291 11.0012 8.99821 11.0012C6.86731 11.0012 4.99091 12.5002 4.53581 14.5666C4.35171 15.405 4.87561 16.2634 5.72871 16.5207C6.78831 16.8395 7.88841 17.0012 8.99821 17.0012C10.1037 17.0012 11.2033 16.8396 12.2672 16.5207C13.1212 16.2639 13.6451 15.4055 13.4606 14.5661Z"
      fill="currentColor"
    ></path>
  </svg>
);

const OrchestrationIcon = () => (
  <svg
    width="20"
    height="15"
    viewBox="0 0 20 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="size-10 text-neutral-400"
  >
    <path
      d="M4.92285 14.8848H0V9.96191H4.92285V14.8848ZM19.6924 14.8848H9.84668V9.96191H4.92383V5.03809H9.84668V0.115234H19.6924V14.8848ZM9.84668 9.96191H14.7695V5.03906H9.84668V9.96191ZM4.92285 5.03809H0V0.115234H4.92285V5.03809Z"
      fill="currentColor"
    ></path>
  </svg>
);

const IntegrationBadge = ({ icon, name }) => (
  <div className="flex items-center gap-1 w-fit rounded-sm px-1 py-0.5 border border-neutral-200 dark:border-neutral-700 text-sm">
    {icon}
    <p className="text-xs text-neutral-500">{name}</p>
  </div>
);

const FeatureCard = ({ icon, title, description, integrations }) => (
  <div
    className="p-4 shadow-black/10 gap-4 border bg-white dark:bg-neutral-800 border-transparent ring-1 rounded-[16px] ring-black/10 flex items-start"
    style={{ opacity: 1, transform: "none" }}
  >
    <div
      className="size-6 shrink-0 rounded-full bg-blue-500 flex mt-1 items-center justify-center"
      style={{ backgroundColor: icon.color }}
    >
      {icon.component}
    </div>
    <div>
      <p className="text-base font-normal text-gray-950 dark:text-gray-50">
        {title}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-balance">
        {description}
      </p>
      {integrations && (
        <div className="mt-2 flex flex-row flex-wrap gap-2">
          {integrations.map((integration, index) => (
            <IntegrationBadge
              key={index}
              icon={integration.icon}
              name={integration.name}
            />
          ))}
        </div>
      )}
    </div>
  </div>
);

export default function AgentStudioSection() {
  const toolsIntegrations = [
    { icon: <SalesforceIcon />, name: "Factures" },
    { icon: <HubspotIcon />, name: "Devis" },
    { icon: <SheetsIcon />, name: "OCR" },
  ];

  return (
    <section className="lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl px-4 md:px-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 dark:border-neutral-800 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
          {/* Facturation & Comptabilité */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-2xl font-normal text-gray-950 dark:text-gray-50">
                Facturation & Comptabilité
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md text-balance">
                Créez des factures et devis professionnels en quelques clics.
                Numérisez vos reçus avec l'OCR intelligent et suivez votre
                trésorerie en temps réel.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
              <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-[20rem] lg:max-w-sm mx-auto w-full h-full absolute inset-x-0 p-2">
                <FeatureCard
                  icon={{
                    component: <FileIcon />,
                    color: "#5b50fe",
                  }}
                  title="Factures conformes"
                  description="Générez des factures aux normes françaises avec TVA, mentions légales et numérotation automatique."
                  integrations={toolsIntegrations}
                />
                <FeatureCard
                  icon={{
                    component: <SettingsIcon />,
                    color: "#22c55e",
                  }}
                  title="OCR intelligent"
                  description="Scannez vos reçus et justificatifs. L'IA extrait automatiquement les données pour votre comptabilité."
                  integrations={toolsIntegrations}
                />
                <FeatureCard
                  icon={{
                    component: <UserIcon />,
                    color: "#f59e0b",
                  }}
                  title="Relances automatiques"
                  description="Automatisez le suivi de vos impayés avec des relances personnalisées par email."
                  integrations={toolsIntegrations}
                />
              </div>
            </div>
          </div>

          {/* Gestion centralisée */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-2xl font-normal text-gray-950 dark:text-gray-50">
                Gestion centralisée
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md text-balance">
                Centralisez vos clients, projets et documents dans un espace
                unique. Collaborez efficacement avec votre équipe et votre
                comptable.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant mask-radial-from-50% mask-t-from-50%">
              <div
                className="flex-1 rounded-t-3xl gap-2 flex items-center justify-center w-full h-full absolute inset-x-0 p-2"
                style={{
                  transform: "rotateY(20deg) rotateX(20deg) rotateZ(-20deg)",
                }}
              >
                <div className="size-40 bg-white absolute inset-0 dark:bg-neutral-800 shrink-0 border z-[10] rounded-full m-auto flex items-center justify-center border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <OrchestrationIcon />
                </div>
                <div className="inset-0 shrink-0 border rounded-full m-auto shadow border-neutral-100 dark:border-neutral-700 size-60 bg-neutral-100/80 z-[9] dark:bg-neutral-800/80 relative"></div>
                <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-neutral-100 dark:border-neutral-700 size-80 bg-neutral-100/60 z-[8] dark:bg-neutral-800/60"></div>
                <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-neutral-100 dark:border-neutral-700 size-100 bg-neutral-100/40 z-[7] dark:bg-neutral-800/40"></div>
                <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-neutral-100 dark:border-neutral-700 size-120 bg-neutral-100/20 z-[6] dark:bg-neutral-800/20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Features - Outils de productivité */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10 md:mt-20">
          <div>
            <div className="flex items-center gap-2">
              <WorkflowIcon />
              <h3 className="font-normal text-base text-gray-950 dark:text-gray-50">
                Gestion de projets Kanban
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Organisez vos tâches et projets avec des tableaux Kanban
              intuitifs. Suivez l'avancement en temps réel.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <IntegrationIcon />
              <h3 className="font-normal text-base text-gray-950 dark:text-gray-50">
                Signatures mail pro
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Créez des signatures mail professionnelles personnalisées pour
              toute votre équipe en quelques minutes.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <HumanIcon />
              <h3 className="font-normal text-base text-gray-950 dark:text-gray-50">
                Transfert de fichiers sécurisé
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Partagez des fichiers volumineux jusqu'à 5 Go avec vos clients via
              des liens sécurisés et QR codes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
