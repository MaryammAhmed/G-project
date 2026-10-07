export default function CyberBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-space">
      {/* Deep cosmic glow */}
      <div
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-[500px]
          w-[500px]
          rounded-full
          bg-cosmic-purple/15
          blur-[120px]
        "
      />

      {/* Blue atmospheric glow */}
      <div
        className="
          pointer-events-none
          absolute
          -right-40
          top-1/3
          h-[450px]
          w-[450px]
          rounded-full
          bg-electric-blue/10
          blur-[120px]
        "
      />

      {/* Brick-red atmospheric glow */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-[-200px]
          left-1/3
          h-[500px]
          w-[500px]
          rounded-full
          bg-maya-red/10
          blur-[130px]
        "
      />

      {/* Stars */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[12%] top-[18%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[28%] top-[12%] h-1 w-1 rounded-full bg-electric-blue" />
        <div className="absolute left-[63%] top-[20%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[82%] top-[14%] h-1 w-1 rounded-full bg-mystic-violet" />
        <div className="absolute left-[74%] top-[58%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[20%] top-[68%] h-1 w-1 rounded-full bg-electric-blue" />
        <div className="absolute left-[48%] top-[82%] h-1 w-1 rounded-full bg-white" />
      </div>

      {/* Subtle mystical grid */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.035]
          [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)]
          [background-size:80px_80px]
        "
      />

      {/* Actual page content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </main>
  );
}
