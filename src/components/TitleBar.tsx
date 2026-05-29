import React from 'react';
import { Network, Laptop, Minimize2, Square, X, ShieldAlert } from 'lucide-react';

interface TitleBarProps {
  appName: string;
  isOnline: boolean;
  onClose?: () => void;
  onMaximize?: () => void;
  onMinimize?: () => void;
}

export default function TitleBar({ appName, isOnline, onClose, onMaximize, onMinimize }: TitleBarProps) {
  return (
    <div id="win11-titlebar" className="h-11 flex items-center justify-between select-none px-4 border-b border-white/8 bg-zinc-900/90 text-zinc-300">
      {/* Left controls: App Icon and Title */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-600 shadow-sm shadow-blue-500/20">
          <Network className="w-4 h-4 text-white" />
        </div>
        <span className="font-sans font-semibold text-xs tracking-wide text-white">
          {appName}
        </span>
      </div>

      {/* Middle Title */}
      <div className="flex-1 text-center text-xs font-semibold text-zinc-400 pointer-events-none tracking-wide uppercase select-none">
        Local File Sharing
      </div>

      {/* Right controls: Windows Window Management Actions */}
      <div className="flex items-center gap-1">
        {/* Minimize */}
        <button
          id="win-btn-minimize"
          onClick={onMinimize}
          className="w-11 h-11 flex items-center justify-center hover:bg-white/5 active:bg-white/10 rounded-sm transition-colors text-zinc-400 hover:text-white"
          title="Minimize"
        >
          <div className="w-3.5 h-[1px] bg-zinc-400" />
        </button>

        {/* Maximize */}
        <button
          id="win-btn-maximize"
          onClick={onMaximize}
          className="w-11 h-11 flex items-center justify-center hover:bg-white/5 active:bg-white/10 rounded-sm transition-colors text-zinc-400 hover:text-white"
          title="Maximize"
        >
          <Square className="w-3 h-3 text-zinc-400 stroke-[1.5px]" />
        </button>

        {/* Close */}
        <button
          id="win-btn-close"
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center hover:bg-red-600 active:bg-red-700 rounded-sm transition-colors text-zinc-400 hover:text-white"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
