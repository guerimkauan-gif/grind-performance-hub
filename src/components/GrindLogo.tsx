export function GrindLogo({ height = 36 }: { height?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 140"
      height={height}
      role="img"
      aria-label="GRIND"
      style={{ display: "block" }}
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        style={{
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          fontWeight: 700,
          fontSize: "96px",
          letterSpacing: "12px",
          fill: "#ffffff",
        }}
      >
        GRIND
      </text>
    </svg>
  );
}
