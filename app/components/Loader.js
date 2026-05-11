export default function Loader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#080812] z-50">
      {/* Ambient glow */}
      <div className="absolute w-64 h-64 bg-violet-600/20 rounded-full filter blur-[80px] animate-pulse" />
      <div className="absolute w-48 h-48 bg-cyan-600/15 rounded-full filter blur-[60px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-16 h-16 bg-linear-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/40">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {/* Spinning ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-transparent border-t-violet-500/60 border-r-cyan-500/40 animate-spin" style={{ animationDuration: "1.2s" }} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-base font-semibold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Nova AI
          </p>
          <div className="flex gap-1.5">
            {[0, 150, 300].map((d) => (
              <div
                key={d}
                className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
