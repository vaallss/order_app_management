import React from 'react';

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl mx-auto flex items-center justify-center text-xl font-bold">
          ⚡
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          LSP Starter Template
        </h1>
        <p className="text-sm text-slate-500">
          Folder stack kosongan siap dipakai. Tailwind CSS & Axios sudah terpasang.
        </p>
        <div className="pt-2 text-xs text-slate-400 border-t border-slate-100">
          Mulai ngoding di <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">src/App.jsx</code>
        </div>
      </div>
    </div>
  );
}

export default App;
