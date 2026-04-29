import { GrindLogo } from "@/components/GrindLogo";

export function AuthLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes grind-auth-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <GrindLogo size={32} letterSpacing="0.2em" />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: "#1A1A1A",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "40%",
            height: "100%",
            background: "#E8003D",
            animation: "grind-auth-bar 1.2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
