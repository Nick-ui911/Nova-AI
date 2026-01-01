export default function Loader() {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-transparent z-50">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
        
          <div className="absolute top-1/2 left-1/2 w-3 h-3 sm:w-4 sm:h-4 -translate-x-1/2 -translate-y-1/2 bg-purple-400 rounded-full shadow-lg shadow-purple-500/50" />
  
        
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
  
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "1.5s" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-lg shadow-purple-400/50" />
          </div>
  
         
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "1.5s", animationDelay: "0.75s" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full shadow-lg shadow-cyan-400/50" />
          </div>
        </div>
  
      
        <p className="mt-6 text-purple-300 font-medium text-base sm:text-lg tracking-wider animate-pulse">
          Loading...
        </p>
      </div>
    );
  }
  