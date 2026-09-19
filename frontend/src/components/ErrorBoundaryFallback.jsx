import React from 'react';

export default function ErrorBoundaryFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full card p-8 text-center shadow-card-lg">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          ⚠
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Oops, something broke!</h2>
        <p className="text-sm text-slate-500 mb-6">
          A coding error caused the screen to crash. Check your VS Code edits.
        </p>
        <div className="bg-red-50 p-4 rounded-lg text-left overflow-auto mb-6 border border-red-100">
          <p className="font-mono text-xs text-red-600 break-all">{error.message}</p>
        </div>
        <button 
          onClick={resetErrorBoundary}
          className="btn-primary w-full py-3 bg-red-600 hover:bg-red-700 shadow-red"
        >
          Try Again / Reload Page
        </button>
      </div>
    </div>
  );
}
