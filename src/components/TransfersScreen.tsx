import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Play, Pause, Trash2, CheckCircle2, 
  Clock, Zap, Wifi, HardDrive, History, FileCheck, CircleSlash, RefreshCw,
  FolderOpen, AlertTriangle, ExternalLink, X, FileText, Image as ImageIcon,
  Video as VideoIcon, Music as MusicIcon, File, Check, Info, FileSpreadsheet, RotateCcw,
  Send, Bell
} from 'lucide-react';
import { TransferItem } from '../types';

interface TransfersScreenProps {
  transfers: TransferItem[];
  onUpdateTransfersList: (updatedList: TransferItem[]) => void;
}

// Local PC fallback name matching App.tsx
const LOCAL_PC_NAME = 'LivingRoom-PC (Local)';

// Helper mapping extensions to icons and visual categories
const getFileIconAndColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return {
      icon: <ImageIcon className="w-5 h-5 text-sky-400" />,
      color: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      label: 'JPEG/PNG Image'
    };
  }
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(ext)) {
    return {
      icon: <VideoIcon className="w-5 h-5 text-rose-400" />,
      color: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      label: 'HD Video Document'
    };
  }
  if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(ext)) {
    return {
      icon: <MusicIcon className="w-5 h-5 text-teal-400" />,
      color: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
      label: 'Audio Recording'
    };
  }
  if (['pdf'].includes(ext)) {
    return {
      icon: <FileText className="w-5 h-5 text-red-400" />,
      color: 'bg-red-500/10 border-red-500/20 text-red-400',
      label: 'PDF Document'
    };
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return {
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
      color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      label: 'Excel Worksheet'
    };
  }
  if (['docx', 'doc', 'txt', 'md'].includes(ext)) {
    return {
      icon: <FileText className="w-5 h-5 text-neutral-300" />,
      color: 'bg-zinc-500/10 border-zinc-500/20 text-neutral-300',
      label: 'Rich Document'
    };
  }
  return {
    icon: <File className="w-5 h-5 text-purple-400" />,
    color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    label: 'Linked Data asset'
  };
};

export default function TransfersScreen({
  transfers,
  onUpdateTransfersList,
}: TransfersScreenProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'failed'>('all');

  // Brief active toast alerts for secondary triggers
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(p => p === msg ? null : p);
    }, 2500);
  };

  // SINGLE ACTIONS:
  const handlePauseTransfer = (id: string, fileName: string) => {
    const updated = transfers.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'paused' as const,
          speed: '0 KB/s',
        };
      }
      return t;
    });
    onUpdateTransfersList(updated);
    showToast(`Paused: ${fileName}`);
  };

  const handleResumeTransfer = (id: string, fileName: string) => {
    const updated = transfers.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'running' as const,
          speed: 'Authenticating...',
        };
      }
      return t;
    });
    onUpdateTransfersList(updated);
    showToast(`Resumed: ${fileName}`);
  };

  const handleCancelTransfer = (id: string, fileName: string) => {
    const updated = transfers.filter(t => t.id !== id);
    onUpdateTransfersList(updated);
    showToast(`Cancelled: ${fileName}`);
  };

  const handleRetryTransfer = (id: string, fileName: string) => {
    const updated = transfers.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'running' as const,
          progress: 0,
          speed: 'Connecting...',
          eta: 'Calculating...'
        };
      }
      return t;
    });
    onUpdateTransfersList(updated);
    showToast(`Retrying: ${fileName}`);
  };

  // Simulate remote disconnect failure for developer diagnostics & verified challenges
  const handleSimulateFailure = (id: string, fileName: string) => {
    const updated = transfers.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'failed' as const,
          speed: '0 KB/s',
          eta: 'Failed'
        };
      }
      return t;
    });
    onUpdateTransfersList(updated);
  };

  // Open completed file action simulation
  const handleOpenFile = (fileName: string) => {
    showToast(`Opening file: ${fileName}...`);
  };

  // Open enclosing parent folder
  const handleOpenFolder = (fileName: string) => {
    showToast(`Opening parent folder for: ${fileName}...`);
  };

  // Send Again creates a clean new active queued instance of completed file
  const handleSendAgain = (item: TransferItem) => {
    const newId = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newTransfer: TransferItem = {
      ...item,
      id: newId,
      progress: 0,
      status: 'waiting',
      speed: 'Waiting...',
      eta: 'Connecting...'
    };
    onUpdateTransfersList([newTransfer, ...transfers]);
    showToast(`Queued "${item.fileName}" to transfer again!`);
  };

  // GLOBAL ACTIONS:
  const handlePauseAll = () => {
    const updated = transfers.map(t => {
      if (t.status === 'running' || t.status === 'waiting') {
        return { ...t, status: 'paused' as const, speed: '0 KB/s' };
      }
      return t;
    });
    onUpdateTransfersList(updated);
    showToast('Paused all active stream sockets.');
  };

  const handleResumeAll = () => {
    const updated = transfers.map(t => {
      if (t.status === 'paused') {
        return { ...t, status: 'running' as const, speed: 'Reconnecting...' };
      }
      return t;
    });
    onUpdateTransfersList(updated);
    showToast('Resuming all paused stream connections.');
  };

  const handleClearHistory = () => {
    const updated = transfers.filter(t => t.status !== 'completed' && t.status !== 'failed');
    onUpdateTransfersList(updated);
    showToast('Cleared all historical logs.');
  };

  // Groupings & classification mapping
  const activeItems = transfers.filter(t => t.status === 'running' || t.status === 'waiting' || t.status === 'paused');
  const finishedItems = transfers.filter(t => t.status === 'completed' || t.status === 'failed');

  const filteredHistory = finishedItems.filter(item => {
    if (historyFilter === 'completed') return item.status === 'completed';
    if (historyFilter === 'failed') return item.status === 'failed';
    return true;
  });

  const getActiveBandwidth = () => {
    const running = transfers.filter(t => t.status === 'running' && t.speed !== '0 KB/s' && t.speed !== 'Connecting...');
    if (running.length === 0) return '0.0 MB/s';
    
    // Average speeds computed together
    let totalMB = 0;
    running.forEach(item => {
      const match = item.speed.match(/([\d.]+)\s*(MB|KB)/);
      if (match) {
        let val = parseFloat(match[1]);
        if (match[2] === 'KB') val /= 1024;
        totalMB += val;
      }
    });

    return totalMB > 0 ? `${totalMB.toFixed(1)} MB/s` : '0.0 MB/s';
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-zinc-950/20 text-[#e0e0e0] font-sans h-full relative" id="transfers-queue-panel">
      
      {/* Toast alert notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-blue-500/30 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-fade-in text-xs text-zinc-100 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ribbon toolbar matching layout guidelines */}
      <div className="flex items-center justify-between pb-6 border-b border-white/5 select-none flex-wrap gap-4 text-left">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-sans md:text-2xl">
            File Transfer Pipeline
            <span className="text-[9px] bg-blue-500/10 text-blue-400 font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
              Direct socket active
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xl leading-relaxed">
            Direct wireless pipeline mapping for high-capacity files with automated background flow and transfer progress tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeItems.length > 0 && (
            <button
              onClick={handlePauseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900 text-xs font-bold text-zinc-350 hover:text-white transition cursor-pointer active:scale-95"
              title="Halt all socket file transfers"
            >
              <Pause className="w-3.5 h-3.5 text-zinc-400 fill-zinc-400/10" />
              <span>Pause All</span>
            </button>
          )}

          {transfers.some(t => t.status === 'paused') && (
            <button
              onClick={handleResumeAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/15 hover:bg-blue-500/25 text-xs font-bold text-blue-400 transition cursor-pointer active:scale-95"
              title="Resume any paused stream connections"
            >
              <Play className="w-3.5 h-3.5 fill-blue-400/10" />
              <span>Resume All</span>
            </button>
          )}

          {finishedItems.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 hover:border-red-500/25 hover:bg-red-500/5 text-xs font-bold text-zinc-400 hover:text-red-400 transition cursor-pointer active:scale-95"
              title="Purge successfully finished logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* METAMETRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3.5 select-none text-left">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Zap className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <span className="block text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider">Concurrent Speed</span>
            <span className="text-base font-bold font-mono text-zinc-150">{getActiveBandwidth()}</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3.5 select-none text-left">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Wifi className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <span className="block text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider">Active Stream</span>
            <span className="text-base font-bold font-mono text-zinc-150">{activeItems.length} active</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3.5 select-none text-left">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider">Transferred</span>
            <span className="text-base font-bold font-mono text-zinc-150">{transfers.filter(t => t.status === 'completed').length} files</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3.5 select-none text-left">
          <div className={`p-2.5 rounded-xl border ${transfers.some(t => t.status === 'failed') ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' : 'bg-zinc-900/10 border-white/5 text-zinc-500'}`}>
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="block text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider">Error Faults</span>
            <span className="text-base font-bold font-mono text-zinc-150">{transfers.filter(t => t.status === 'failed').length} errors</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER LAYOUT */}
      <div className="space-y-8 select-none">
        
        {/* SECTION 1: ACTIVE TRANSFERS QUEUE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.04] text-left">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">
              Active Transfer Queue ({activeItems.length})
            </h2>
            {activeItems.some(t => t.status === 'running') && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
            )}
          </div>

          {activeItems.length === 0 ? (
            <div className="p-10 border border-dashed border-white/5 rounded-2xl text-center bg-zinc-900/10">
              <CircleSlash className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <h4 className="text-xs font-semibold text-zinc-400">No active network transfers queued</h4>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto leading-normal">
                Transfers trigger automatically when downloading pictures or moving documents from the File Browser storage view.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {activeItems.map((item) => {
                const isOutgoing = item.direction === 'outgoing';
                const isPaused = item.status === 'paused';
                const isConnecting = item.status === 'running' && (item.progress === 0 || item.speed === 'Connecting...');
                const isTransferring = item.status === 'running' && item.progress > 0 && item.speed !== 'Connecting...';

                const sourceDevice = isOutgoing ? LOCAL_PC_NAME : item.deviceName;
                const destinationDevice = isOutgoing ? item.deviceName : LOCAL_PC_NAME;

                const fileMeta = getFileIconAndColor(item.fileName);

                let stateLabel = 'Waiting';
                let stateBadgeColor = 'bg-zinc-850 text-zinc-400 border-zinc-700/40';
                if (isPaused) {
                  stateLabel = 'Paused';
                  stateBadgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
                } else if (isConnecting) {
                  stateLabel = 'Connecting';
                  stateBadgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                } else if (isTransferring) {
                  stateLabel = 'Active Piping';
                  stateBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/25';
                }

                return (
                  <div
                    key={item.id}
                    className="bg-zinc-900/30 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition relative overflow-hidden text-left"
                  >
                    {/* Visual left edge marker matching status state */}
                    {isTransferring && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                    {isConnecting && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 animate-pulse" />}
                    {isPaused && <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-600" />}

                    {/* Left details pane */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl border shrink-0 ${fileMeta.color}`}>
                        {fileMeta.icon}
                      </div>

                      <div className="truncate flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate max-w-[280px]" title={item.fileName}>
                            {item.fileName}
                          </h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold border ${stateBadgeColor}`}>
                            {stateLabel}
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-mono truncate">
                          <span className="text-zinc-400 truncate max-w-[130px]" title={sourceDevice}>{sourceDevice}</span>
                          <span className="text-zinc-600 font-bold">➔</span>
                          <span className="text-zinc-300 font-semibold truncate max-w-[130px]" title={destinationDevice}>{destinationDevice}</span>
                          <span className="text-zinc-705">•</span>
                          <span className="font-semibold text-zinc-450">{item.size}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle stats & progress bar */}
                    <div className="flex-1 max-w-sm shrink-0">
                      <div className="flex justify-between text-[11px] mb-1.5 font-mono">
                        <div className="flex items-center gap-1.2 font-semibold text-zinc-400">
                          {isTransferring && <Wifi className="w-3.5 h-3.5 text-blue-500 animate-pulse mr-1" />}
                          <span>{isPaused ? 'Socket halted' : item.speed}</span>
                        </div>
                        <span className="font-bold text-zinc-100">
                          {item.progress}% • {isPaused ? 'Paused' : item.eta}
                        </span>
                      </div>

                      <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPaused ? 'bg-zinc-600' :
                            isConnecting ? 'bg-cyan-500 animate-pulse' :
                            'bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.35)]'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Right action tools */}
                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      {isPaused ? (
                        <button
                          onClick={() => handleResumeTransfer(item.id, item.fileName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-[11px] font-bold text-blue-400 hover:text-white transition cursor-pointer"
                          title="Resume this download link"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePauseTransfer(item.id, item.fileName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-900/60 hover:bg-zinc-805 text-[11px] font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Pause file sync stream"
                        >
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </button>
                      )}

                      {/* Manual failure simulation handler */}
                      {item.status === 'running' && (
                        <button
                          onClick={() => handleSimulateFailure(item.id, item.fileName)}
                          className="p-2 rounded-xl border border-white/5 hover:border-amber-500/25 hover:bg-amber-500/10 text-zinc-500 hover:text-amber-400 transition cursor-pointer"
                          title="Simulate network exception"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCancelTransfer(item.id, item.fileName)}
                        className="p-2 rounded-xl border border-white/5 hover:border-red-500/25 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                        title="Cancel/Abort connection task"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: MERGED TRANSFER HISTORY LOG */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.04] text-left flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">
                Transfer History ({finishedItems.length})
              </h2>
            </div>

            {/* Visual Filter Option pills */}
            <div className="flex items-center gap-1.5 font-sans">
              {[
                { id: 'all', label: `All Logs (${finishedItems.length})` },
                { id: 'completed', label: `Completed (${finishedItems.filter(f => f.status === 'completed').length})` },
                { id: 'failed', label: `Failed (${finishedItems.filter(f => f.status === 'failed').length})` }
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setHistoryFilter(pill.id as any)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                    historyFilter === pill.id ? 'bg-zinc-100 border-zinc-200 text-zinc-950 font-extrabold shadow-sm' : 'bg-transparent border-white/5 hover:bg-white/[0.04] text-zinc-400'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-8 border border-white/5 rounded-2xl text-center bg-zinc-900/5 text-zinc-500 text-xs font-semibold">
              No historical transfer logs found matching selected filter.
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/[0.03] shadow-xl text-left">
              {filteredHistory.map((item) => {
                const isOutgoing = item.direction === 'outgoing';
                const isSuccess = item.status === 'completed';
                const fileMeta = getFileIconAndColor(item.fileName);

                const sourceDevice = isOutgoing ? LOCAL_PC_NAME : item.deviceName;
                const destinationDevice = isOutgoing ? item.deviceName : LOCAL_PC_NAME;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition"
                  >
                    {/* Left details panel component */}
                    <div className="flex items-center gap-3.5 truncate flex-1 min-w-0 pr-1">
                      <div className={`p-2 rounded-xl border shrink-0 ${isSuccess ? fileMeta.color : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                        {fileMeta.icon}
                      </div>

                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-zinc-200 truncate max-w-[280px]" title={item.fileName}>
                            {item.fileName}
                          </h4>
                          
                          {isSuccess ? (
                            <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold leading-none">
                              <Check className="w-2.5 h-2.5" />
                              <span>Success</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold leading-none">
                              <X className="w-2.5 h-2.5" />
                              <span>Error</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 mt-1 truncate">
                          <span className="truncate max-w-[110px] text-zinc-400" title={sourceDevice}>{sourceDevice}</span>
                          <span className="text-zinc-650 font-bold">➔</span>
                          <span className="text-zinc-400 truncate max-w-[110px]" title={destinationDevice}>{destinationDevice}</span>
                          <span>•</span>
                          <span className="text-zinc-455 font-semibold text-zinc-500">{item.size}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto justify-end">
                      {!isSuccess && (
                        <div className="text-[9px] text-zinc-500 flex items-center gap-1 bg-zinc-900/50 px-2 py-1 rounded-lg border border-white/5 mr-1 font-mono">
                          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>Socket closed safely</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {isSuccess ? (
                          <>
                            <button
                              onClick={() => handleOpenFile(item.fileName)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white hover:bg-zinc-800 text-[10px] font-bold transition cursor-pointer"
                              title="Launch original stub file"
                            >
                              <ExternalLink className="w-3 h-3 text-zinc-400" />
                              <span>Open File</span>
                            </button>
                            <button
                              onClick={() => handleOpenFolder(item.fileName)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white hover:bg-zinc-800 text-[10px] font-bold transition cursor-pointer"
                              title="Go to file enclosing directory"
                            >
                              <FolderOpen className="w-3 h-3 text-zinc-400" />
                              <span>Open Folder</span>
                            </button>
                            {/* SEND AGAIN ACTION */}
                            <button
                              onClick={() => handleSendAgain(item)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white text-[10px] font-bold transition cursor-pointer"
                              title="Transmit this item copies again"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send Again</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRetryTransfer(item.id, item.fileName)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition cursor-pointer shadow-md shadow-blue-600/10 active:scale-95"
                            title="Reconstitute this transfer socket link"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry Transfer</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCancelTransfer(item.id, item.fileName)}
                          className="p-1 px-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition cursor-pointer ml-1"
                          title="Purge record"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
