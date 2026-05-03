export default function AvanzaLogo({ size = 16, className = "" }) {
  return (
    <svg
      width={Math.round(size * 1.34)}
      height={size}
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="0" y="15" width="9" height="9" rx="2" fill="currentColor" />
      <rect x="11.5" y="7.5" width="9" height="9" rx="2" fill="currentColor" fillOpacity="0.65" />
      <rect x="23" y="0" width="9" height="9" rx="2" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}
