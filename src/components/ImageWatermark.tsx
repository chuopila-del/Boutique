interface ImageWatermarkProps {
  variant?: 'center' | 'corner';
}

export function ImageWatermark({ variant = 'center' }: ImageWatermarkProps) {
  if (variant === 'corner') {
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-3.5 select-none font-display text-xs font-semibold tracking-[0.2em] text-[#F5F2EC]/35 drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]"
      >
        semi joias
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
    >
      <span className="-rotate-12 font-display text-base font-semibold tracking-[0.24em] text-[#F5F2EC]/28 drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)] sm:text-lg">
        semi joias
      </span>
    </span>
  );
}
