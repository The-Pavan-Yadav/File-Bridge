import React from 'react';
import { Laptop, Smartphone, Folder, ArrowLeftRight, Settings, Info, Library, HardDrive, Wifi } from 'lucide-react';

export type SidebarTab = 'devices' | 'files' | 'transfers' | 'settings';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  localDeviceName: string;
  transferCount: number;
}

export default function Sidebar({ activeTab, onTabChange, localDeviceName, transferCount }: SidebarProps) {
  const menuItems = [
    { id: 'devices' as SidebarTab, label: 'Devices & Discovery', icon: Laptop },
    { id: 'files' as SidebarTab, label: 'File Explorer', icon: Folder },
    { id: 'transfers' as SidebarTab, label: 'Transfer Queue', icon: ArrowLeftRight, badge: transferCount > 0 ? transferCount : undefined },
    { id: 'settings' as SidebarTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div id="win11-sidebar" className="w-[240px] flex flex-col justify-between border-r border-white/8 bg-zinc-950/70 p-3 text-zinc-300">
      {/* Upper Navigation Items */}
      <div className="space-y-4">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5">
          <div className="p-2 h-9 w-9 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
            W
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate leading-tight">{localDeviceName}</h4>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5 font-sans">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Windows Host
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-white/8 mx-1" />

        {/* Tab Buttons */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isTransfersActive = item.id === 'transfers' && transferCount > 0;
            return (
              <button
                id={`sidebar-tab-${item.id}`}
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold shadow-sm border-l-2 border-blue-500'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-400'} ${isTransfersActive ? 'animate-pulse text-blue-400' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'transfers' && transferCount > 0 ? (
                  <div className="flex items-center gap-1.5 select-none" id="active-transfers-sidebar-badge">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="bg-blue-600/25 border border-blue-500/30 font-mono text-[9px] font-extrabold text-blue-300 tracking-tighter px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <span>⬇️</span>
                      <span>{transferCount}</span>
                    </span>
                  </div>
                ) : item.badge !== undefined ? (
                  <span className="bg-blue-600 text-[10px] font-mono text-white tracking-tighter px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Details */}
      <div className="space-y-2">
        <div className="h-[1px] bg-white/5 mx-1" />
        <div className="px-3 py-1 text-[11px] text-zinc-500 font-medium tracking-tight">
          FileBridge v1.2
        </div>
      </div>
    </div>
  );
}
