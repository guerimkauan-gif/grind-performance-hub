export function GrindLogo({
  size = 22,
  letterSpacing = "0.15em",
}: {
  size?: number;
  height?: number;
  letterSpacing?: string;
}) {
  return (
    <span
      role="img"
      aria-label="GRIND"
      style={{
        fontFamily: "'Space Grotesk', Arial, sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing,
        color: "#FFFFFF",
        lineHeight: 1,
        display: "inline-block",
        fontFeatureSettings: "normal",
        fontVariant: "normal",
      }}
    >
      GRIND
    </span>
  );
}
