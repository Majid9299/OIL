import Image from "next/image";

interface InvareMarkProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

// logo.jpg is the full lockup (icon + Arabic/Latin wordmark) on a wide white
// canvas. The fractions below crop just the flame icon out of that canvas for
// icon-only usage; withWordmark skips the crop and shows the full lockup.
const LOGO_NATURAL_WIDTH = 3721;
const LOGO_NATURAL_HEIGHT = 3043;
const ICON_LEFT_FRACTION = 0.415;
const ICON_RIGHT_FRACTION = 0.565;
const ICON_TOP_FRACTION = 0.11;
const ICON_BOTTOM_FRACTION = 0.505;

export function InvareMark({ size = 32, withWordmark = false, className }: InvareMarkProps) {
  if (withWordmark) {
    const height = size * 1.8;
    const width = (height * LOGO_NATURAL_WIDTH) / LOGO_NATURAL_HEIGHT;
    return (
      <div className={`flex items-center ${className ?? ""}`}>
        <Image src="/logo.jpg" alt="Invare" width={width} height={height} priority />
      </div>
    );
  }

  const widthFraction = ICON_RIGHT_FRACTION - ICON_LEFT_FRACTION;
  const heightFraction = ICON_BOTTOM_FRACTION - ICON_TOP_FRACTION;
  const imgWidth = size / widthFraction;
  const imgHeight = size / heightFraction;

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.jpg"
        alt="Invare"
        width={imgWidth}
        height={imgHeight}
        className="absolute max-w-none"
        style={{
          width: imgWidth,
          height: imgHeight,
          left: -(ICON_LEFT_FRACTION * imgWidth),
          top: -(ICON_TOP_FRACTION * imgHeight),
        }}
        priority
      />
    </div>
  );
}
