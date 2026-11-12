export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="8" stroke="#3D8BFF" strokeOpacity="0.5" />
        <path
          d="M5 17h5l3-7 4 13 3-9 2 3h5"
          stroke="#3D8BFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight text-white">
        Pulse<span className="text-accent"> AI</span>
      </span>
    </div>
  );
}
