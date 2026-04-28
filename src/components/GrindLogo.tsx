export function GrindLogo({ size = 28 }: { size?: number; height?: number }) {
  return (
    <span
      role="img"
      aria-label="GRIND"
      style={{
        fontFamily: "'Space Grotesk', Arial, sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.05em",
        color: "#FFFFFF",
        lineHeight: 1,
        display: "inline-block",
      }}
    >
      GRIND
    </span>
  );
}
