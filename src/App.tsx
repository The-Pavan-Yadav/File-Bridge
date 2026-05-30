import React, { useState, useEffect, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar, { SidebarTab } from './components/Sidebar';
import DevicesScreen from './components/DevicesScreen';
import FileBrowserScreen from './components/FileBrowserScreen';
import TransfersScreen from './components/TransfersScreen';
import SettingsScreen from './components/SettingsScreen';
import AndroidCompanionApp from './components/AndroidCompanionApp';
import { Laptop, Smartphone, RefreshCw, CheckCircle2, AlertTriangle, Wifi, X } from 'lucide-react';

import { Device, TransferItem, AppSettings } from './types';
import { initialDevices, initialTransfers, defaultSettings } from './mockData';

export default function App() {
  // Navigation & Screen View Controller State
  const [activeTab, setActiveTab] = useState<SidebarTab>('devices');
  const [browsedPeerDevice, setBrowsedPeerDevice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pc' | 'android' | 'dual'>('dual');

  // Core Discovery States with dynamic network discovery
  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const cached = localStorage.getItem('filebridge_devices');
      return cached ? JSON.parse(cached) : initialDevices;
    } catch (e) {
      return initialDevices;
    }
  });
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [hostInfo, setHostInfo] = useState<{ hostname: string; localIp: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFirstScanDone, setIsFirstScanDone] = useState(false);

  // Incremental updates helper to prevent full UI re-renders and card recreation
  const updateDevicesIncrementally = (incoming: Device[]) => {
    setDevices(prev => {
      let changed = false;
      const incomingMap = new Map(incoming.map(d => [d.id, d]));

      // Filter out devices that are no longer in our network
      const filtered = prev.filter(p => {
        const keeps = incomingMap.has(p.id) || p.id === 'dev-laptop-local' || p.id === 'dev-pixel8-local';
        if (!keeps) changed = true;
        return keeps;
      });

      // Update values for existing devices
      const updated = filtered.map(item => {
        const inc = incomingMap.get(item.id);
        if (!inc) return item;

        const hasDiff =
          item.name !== inc.name ||
          item.status !== inc.status ||
          item.ipAddress !== inc.ipAddress ||
          item.batteryPercentage !== inc.batteryPercentage ||
          item.connectionQuality !== inc.connectionQuality ||
          item.isTrusted !== inc.isTrusted ||
          item.storageFree !== inc.storageFree ||
          item.storageTotal !== inc.storageTotal ||
          item.lastSeen !== inc.lastSeen ||
          item.category !== inc.category ||
          item.type !== inc.type ||
          item.avatarColor !== inc.avatarColor;

        if (hasDiff) {
          changed = true;
          return { ...item, ...inc };
        }
        return item; // keeps same reference
      });

      // Add new devices
      const brandNew: Device[] = [];
      incoming.forEach(inc => {
        const exists = updated.some(u => u.id === inc.id);
        if (!exists) {
          brandNew.push(inc);
          changed = true;
        }
      });

      if (changed) {
        return [...updated, ...brandNew];
      }
      return prev; // maintains identical reference to bypass state updates
    });
  };

  // Fetch Host Metadata once on startup
  useEffect(() => {
    fetch('/api/discovery/host-info')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setHostInfo(data);
      })
      .catch(() => {
        console.warn('Network discovery daemon offline or unreachable');
      });
  }, []);

  // Sync P2P discoverable heartbeat every 5 seconds
  useEffect(() => {
    let isActive = true;

    const performNetworkDiscovery = async (isBackground = false) => {
      // Only show the scanning state/indicator on the initial mount, NOT on background polls
      if (!isBackground && !isFirstScanDone) {
        setIsScanning(true);
      }
      
      try {
        // Register PC/Windows Client if active in view modes
        if (viewMode === 'pc' || viewMode === 'dual') {
          await fetch('/api/discovery/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'dev-laptop-local',
              name: hostInfo?.hostname || 'Windows-Laptop-LivingRoom',
              type: 'windows',
              category: 'laptop',
              batteryPercentage: 91,
              connectionQuality: 'Excellent',
              ipAddress: hostInfo?.localIp || '192.168.1.110',
              isTrusted: true,
              storageFree: '450 GB',
              storageTotal: '1.0 TB',
              avatarColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
            })
          }).catch(() => {});
        }

        // Register Android Companion if active in view modes
        if (viewMode === 'android' || viewMode === 'dual') {
          await fetch('/api/discovery/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'dev-pixel8-local',
              name: 'Pixel 8 Pro',
              type: 'android',
              category: 'phone',
              batteryPercentage: 84,
              connectionQuality: 'Excellent',
              ipAddress: '192.168.1.142',
              isTrusted: true,
              storageFree: '128 GB',
              storageTotal: '256 GB',
              avatarColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            })
          }).catch(() => {});
        }

        // Retrieve other active nodes found on same local subnets
        const res = await fetch('/api/discovery/devices');
        if (!res.ok) {
          throw new Error(`Daemon server returned non-200 HTTP status: ${res.status}`);
        }
        const data: Device[] = await res.json();

        if (isActive) {
          updateDevicesIncrementally(data);
          setDiscoveryError(null);
          setIsFirstScanDone(true);
        }
      } catch (err: any) {
        if (isActive) {
          setDiscoveryError('Failed to establish connection to local daemon service. Retry is automated.');
        }
      } finally {
        if (isActive) {
          if (!isBackground) {
            setTimeout(() => {
              if (isActive) setIsScanning(false);
            }, 800);
          }
        }
      }
    };

    // Run discovery immediately (first scan)
    performNetworkDiscovery(false);

    // Setup interval to automatically poll silently every 5 seconds
    const interval = setInterval(() => {
      performNetworkDiscovery(true);
    }, 5000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [viewMode, hostInfo, isFirstScanDone]);

  const handleManualScan = () => {
    setIsScanning(true);
    fetch('/api/discovery/devices')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        updateDevicesIncrementally(data);
        setDiscoveryError(null);
      })
      .catch(() => {
        setDiscoveryError('Failed to refresh local discovery. Daemon uncommunicative.');
      })
      .finally(() => {
        setTimeout(() => setIsScanning(false), 800);
      });
  };

  const [transfers, setTransfers] = useState<TransferItem[]>(() => {
    try {
      const cached = localStorage.getItem('filebridge_transfers');
      return cached ? JSON.parse(cached) : initialTransfers;
    } catch (e) {
      return initialTransfers;
    }
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const cached = localStorage.getItem('filebridge_settings');
      if (cached) {
        return { ...defaultSettings, ...JSON.parse(cached) };
      }
      return defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('filebridge_favorites');
      return cached ? JSON.parse(cached) : [
        'C:\\Users\\FileBridge\\Downloads',
        'Pixel 8 Pro\\Internal Storage\\Download'
      ];
    } catch (e) {
      return [
        'C:\\Users\\FileBridge\\Downloads',
        'Pixel 8 Pro\\Internal Storage\\Download'
      ];
    }
  });

  // Window Management variables (Simulated)
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowDismissed, setWindowDismissed] = useState(false);

  // Sync state modifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('filebridge_devices', JSON.stringify(devices));
    } catch (e) {
      console.error('Failed to save devices to localStorage', e);
    }
  }, [devices]);

  useEffect(() => {
    try {
      localStorage.setItem('filebridge_transfers', JSON.stringify(transfers));
    } catch (e) {
      console.error('Failed to save transfers to localStorage', e);
    }
  }, [transfers]);

  useEffect(() => {
    try {
      localStorage.setItem('filebridge_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('filebridge_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  // Global background transfer toast notifications state
  const [activeToasts, setActiveToasts] = useState<Array<{
    id: string;
    type: 'started' | 'completed' | 'failed';
    fileName: string;
    size: string;
  }>>([]);

  // Ref-based synchronous tracker to prevent duplicate toasts across fast render updates and component ticks
  const notifiedRef = useRef<Record<string, { started?: boolean; completed?: boolean; failed?: boolean }>>({});
  const isFirstLoadRef = useRef(true);

  // Wrapper helper to append temporary notifications with unique transfer identifier
  const addToastNotification = (type: 'started' | 'completed' | 'failed', fileName: string, size: string, itemId: string) => {
    const toastId = `toast-${itemId}-${type}`;
    
    // Prevent duplicate toast insertion in state
    setActiveToasts(prev => {
      if (prev.some(t => t.id === toastId)) return prev;
      return [...prev, { id: toastId, type, fileName, size }];
    });
    
    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  // Reactive Toast Notifications listener - triggers globally and uses synchronous tracking refs
  useEffect(() => {
    if (isFirstLoadRef.current) {
      // Mark all current prepopulated or pre-existing loaded transfers as already notified as of boot
      transfers.forEach(t => {
        notifiedRef.current[t.id] = {
          started: true,
          completed: t.status === 'completed',
          failed: t.status === 'failed'
        };
      });
      isFirstLoadRef.current = false;
      return;
    }

    transfers.forEach(item => {
      if (!notifiedRef.current[item.id]) {
        notifiedRef.current[item.id] = {};
      }
      const record = notifiedRef.current[item.id];

      if (item.status === 'running' || item.status === 'waiting') {
        if (!record.started) {
          record.started = true;
          console.log(`[FileBridge Transfer Service] Started transfer ID: ${item.id} for file: "${item.fileName}"`);
          addToastNotification('started', item.fileName, item.size, item.id);
        }
      } else if (item.status === 'completed') {
        if (!record.completed) {
          record.completed = true;
          console.log(`[FileBridge Transfer Service] Completed transfer ID: ${item.id} for file: "${item.fileName}"`);
          addToastNotification('completed', item.fileName, item.size, item.id);
        }
      } else if (item.status === 'failed') {
        if (!record.failed) {
          record.failed = true;
          console.log(`[FileBridge Transfer Service] Failed/interrupted transfer ID: ${item.id} for file: "${item.fileName}"`);
          addToastNotification('failed', item.fileName, item.size, item.id);
        }
      }
    });
  }, [transfers]);

  // Global background transfer progress ticking services
  useEffect(() => {
    // 1. Promote all waiting transfers stream-by-stream
    const waitingItems = transfers.filter(t => t.status === 'waiting');
    if (waitingItems.length > 0) {
      setTransfers(prev => prev.map(t => {
        if (t.status === 'waiting') {
          return {
            ...t,
            status: 'running' as const,
            speed: 'Connecting...',
            eta: 'Calculating...'
          };
        }
        return t;
      }));
      return;
    }

    // 2. Tickers active check
    const runningItems = transfers.filter(t => t.status === 'running');
    if (runningItems.length === 0) return;

    // 3. Periodic progress updating
    const interval = setInterval(() => {
      setTransfers(prev => {
        if (!prev.some(t => t.status === 'running')) return prev;
        return prev.map(item => {
          if (item.status === 'running') {
            if (item.progress === 0 || item.speed === 'Connecting...') {
              return {
                ...item,
                progress: 5,
                speed: '14.8 MB/s',
                eta: 'Calculating...'
              };
            }

            const increment = Math.floor(Math.random() * 11) + 7;
            const nextProgress = item.progress + increment;

            if (nextProgress >= 100) {
              return {
                ...item,
                progress: 100,
                status: 'completed' as const,
                speed: '0 KB/s',
                eta: 'Completed'
              };
            } else {
              const speeds = ['49.2 MB/s', '43.5 MB/s', '38.9 MB/s', '41.1 MB/s', '35.6 MB/s'];
              const randomSpeed = speeds[Math.floor(Math.random() * speeds.length)];
              const remainingPercent = 100 - nextProgress;
              const secondsLeft = Math.ceil(remainingPercent / 10);
              return {
                ...item,
                progress: nextProgress,
                speed: randomSpeed,
                eta: `${secondsLeft}s left`
              };
            }
          }
          return item;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [transfers]);

  // INTERACTION: Browse peer storage
  const handleBrowseDeviceFiles = (deviceName: string) => {
    setBrowsedPeerDevice(deviceName);
    setActiveTab('files'); // switch to explorer tab
  };

  // INTERACTION: Pair new mobile phone from wizard
  const handlePairNewDevice = (newDevice: Device) => {
    setDevices([newDevice, ...devices]);
  };

  // INTERACTION: Revoke device pairing permissions
  const handleRevokeDeviceTrust = (deviceId: string) => {
    setDevices(
      devices.map(d => {
        if (d.id === deviceId) {
          return { ...d, isTrusted: false, status: 'pairing' as const };
        }
        return d;
      })
    );
  };

  // INTERACTION: Forget all trusted devices
  const handleForgetAllDevices = () => {
    setDevices(devices.map(d => ({ ...d, isTrusted: false })));
  };

  // INTERACTION: Update a device's nickname
  const handleUpdateDeviceNickname = (deviceId: string, nickname: string) => {
    setDevices(
      devices.map(d => {
        if (d.id === deviceId) {
          return { ...d, nickname };
        }
        return d;
      })
    );
  };

  // INTERACTION: Remove cached node
  const handleRemoveDevice = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId));
  };

  // INTERACTION: Trigger a new transfer from within the file inspector
  const handleTriggerTransfer = (fileName: string, size: string, direction: 'incoming' | 'outgoing', peerDevice: string) => {
    // Prevent duplicate entries in the transfer queue for the exact same active transfer
    let isDuplicate = false;
    setTransfers(prev => {
      isDuplicate = prev.some(t => 
        t.fileName === fileName && 
        t.direction === direction && 
        t.deviceName === peerDevice && 
        (t.status === 'waiting' || t.status === 'running')
      );
      if (isDuplicate) {
        console.warn(`[FileBridge Transfer Service] Ignored duplicate transfer queue query: ${fileName} with target ${peerDevice}`);
        return prev;
      }

      const newId = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newTransfer: TransferItem = {
        id: newId,
        fileName,
        speed: '0 KB/s',
        progress: 0,
        eta: 'Connecting...',
        status: 'waiting',
        size,
        direction,
        deviceName: peerDevice,
      };

      console.log(`[FileBridge Transfer Service] Created unique transfer entry ID: ${newTransfer.id} (${newTransfer.fileName})`);
      return [newTransfer, ...prev];
    });
  };

  // INTERACTION: Toggle Favorite items links
  const handleToggleFavorite = (filePath: string) => {
    if (favorites.includes(filePath)) {
      setFavorites(favorites.filter(item => item !== filePath));
    } else {
      setFavorites([...favorites, filePath]);
    }
  };

  // INTERACTION: Reset configurations defaults
  const handleRestoreDefaults = () => {
    try {
      localStorage.removeItem('filebridge_settings');
      localStorage.removeItem('filebridge_devices');
      localStorage.removeItem('filebridge_transfers');
      localStorage.removeItem('filebridge_favorites');
    } catch (e) {
      console.error(e);
    }
    setSettings(defaultSettings);
    setDevices(initialDevices);
    setTransfers(initialTransfers);
    setFavorites([
      'C:\\Users\\FileBridge\\Downloads',
      'Pixel 8 Pro\\Internal Storage\\Download'
    ]);
    setBrowsedPeerDevice(null);
    setActiveTab('devices');
  };

  // Restore dismissed window simulator
  if (windowDismissed) {
    return (
      <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
        <h2 className="text-lg font-bold text-white mb-2">FileBridge Window Suspended</h2>
        <p className="text-xs text-zinc-500 max-w-sm">
          You dismissed the FileBridge app window. The background daemon continues running in your system tray on Port 5353.
        </p>
        <button
          onClick={() => setWindowDismissed(false)}
          className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          Re-open Window View
        </button>
      </div>
    );
  }

  return (
    /* OUTER BG: Beautiful Fluent Aurora Desktop Wallpaper Simulation */
    <div id="desktop-bg" className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-start p-4 md:p-6 relative overflow-y-auto select-none font-sans">
      
      {/* Decorative colored glow orbs simulating modern Windows desktop wallpaper */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-teal-500/80 rounded-full blur-[120px] pointer-events-none opacity-5" />

      {/* DYNAMIC VIEW WORKSPACE SWITCHER */}
      <div className="z-50 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl flex items-center gap-1.5 mt-2 mb-4">
        <button
          onClick={() => setViewMode('pc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
            viewMode === 'pc' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Windows Client</span>
        </button>
        
        <button
          onClick={() => setViewMode('dual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
            viewMode === 'dual' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-lg' 
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Dual Split View</span>
        </button>

        <button
          onClick={() => setViewMode('android')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
            viewMode === 'android' 
              ? 'bg-emerald-650 text-white shadow-lg' 
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Android Companion</span>
        </button>
      </div>

      {/* CORE SYNC LAYOUT CONTAINER */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 py-2">
        
        {/* Render Windows App Panel inside dual or pc modes */}
        {(viewMode === 'pc' || viewMode === 'dual') && (
          <div
            id="filebridge-app-window"
            className={`flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-white/8 transition-all duration-305 transform mica-effect shrink-0 ${
              isMaximized 
                ? 'fixed inset-4 z-[80] w-[calc(100vw-32px)] h-[calc(100vh-32px)] max-w-none' 
                : viewMode === 'dual'
                  ? 'w-full lg:w-[680px] xl:w-[780px] h-[720px]'
                  : 'w-full max-w-6xl h-[720px]'
            }`}
          >
            {/* TitleBar Windows Framer */}
            <TitleBar
              appName="FileBridge Workspace Console"
              isOnline={true}
              onMinimize={() => alert('Minimize action simulated. Background TCP broadcast is active.')}
              onMaximize={() => setIsMaximized(!isMaximized)}
              onClose={() => setWindowDismissed(true)}
            />

            {/* Inner layout: Left navbar drawer, main contextual view frame */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-zinc-950/40">
              
              {/* Main Sidebar controls */}
              <Sidebar
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  // If flipping back away from FileBrowser tab, reset remote browsing paths
                  if (tab !== 'files') {
                    setBrowsedPeerDevice(null);
                  }
                }}
                localDeviceName="Windows-Laptop-LivingRoom"
                transferCount={transfers.filter(t => t.status === 'running' || t.status === 'waiting').length}
              />

              {/* Core contextual page router layout */}
              {activeTab === 'devices' && (
                <DevicesScreen
                  devices={devices.filter(d => d.id !== 'dev-laptop-local')}
                  onBrowseDeviceFiles={handleBrowseDeviceFiles}
                  onPairNewDevice={handlePairNewDevice}
                  onRevokeDeviceTrust={handleRevokeDeviceTrust}
                  onRemoveDevice={handleRemoveDevice}
                  onTriggerTransfer={handleTriggerTransfer}
                  isScanning={isScanning}
                  discoveryError={discoveryError}
                  onManualTriggerScan={handleManualScan}
                  settings={settings}
                />
              )}

              {activeTab === 'files' && (
                <FileBrowserScreen
                  currentDeviceName={browsedPeerDevice}
                  onTriggerTransfer={handleTriggerTransfer}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onBackToDevices={() => {
                    setBrowsedPeerDevice(null);
                    setActiveTab('devices');
                  }}
                  devices={devices}
                />
              )}

              {activeTab === 'transfers' && (
                <TransfersScreen
                  transfers={transfers}
                  onUpdateTransfersList={(updated) => setTransfers(updated)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsScreen
                  settings={settings}
                  onUpdateSettings={(updated) => setSettings(updated)}
                  onRestoreDefaults={handleRestoreDefaults}
                  devices={devices.filter(d => d.id !== 'dev-laptop-local')}
                  onForgetDevice={handleRemoveDevice}
                  onForgetAllDevices={handleForgetAllDevices}
                  onUpdateDeviceNickname={handleUpdateDeviceNickname}
                />
              )}

            </div>
          </div>
        )}

        {/* Dynamic linking animation between the windows in dual mode */}
        {viewMode === 'dual' && (
          <div className="hidden lg:flex flex-col items-center justify-center gap-1.5 text-zinc-600 font-mono text-[10px] font-bold select-none py-4">
            <div className="w-[1.5px] h-12 bg-gradient-to-b from-blue-500/40 via-indigo-500/40 to-emerald-500/40 relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/60 h-4 animate-bounce" />
            </div>
            <span className="uppercase text-zinc-500 tracking-widest text-[8px]">BRIDGE ACTIVE</span>
            <div className="px-2 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-500/20 text-indigo-400">
              LOCAL P2P LINK
            </div>
            <div className="w-[1.5px] h-12 bg-gradient-to-t from-emerald-500/40 via-indigo-500/40 to-blue-500/40 relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/60 h-4 animate-bounce" />
            </div>
          </div>
        )}

        {/* Render Android App panel inside dual or android modes */}
        {(viewMode === 'android' || viewMode === 'dual') && (
          <div className="shrink-0 transition-all duration-300">
            <AndroidCompanionApp
              devices={devices.filter(d => d.id !== 'dev-pixel8-local')}
              onPairNewDevice={handlePairNewDevice}
              onRevokeDeviceTrust={handleRevokeDeviceTrust}
              onRemoveDevice={handleRemoveDevice}
              transfers={transfers}
              onTriggerTransfer={handleTriggerTransfer}
              setTransfers={setTransfers}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              setDevices={setDevices}
            />
          </div>
        )}

      </div>

      {/* Floating Active Notification toasts */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none" id="global-notifications-container">
        {activeToasts.map(toast => (
          <div
            key={toast.id}
            id={toast.id}
            className="pointer-events-auto bg-[#18181b]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl flex gap-3.5 animate-fade-in relative overflow-hidden text-left"
          >
            {/* Action panel marker bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              toast.type === 'completed' ? 'bg-emerald-500' :
              toast.type === 'failed' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
            }`} />

            <div className="shrink-0 mt-0.5">
              {toast.type === 'completed' && (
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'failed' && (
                <div className="p-1.5 bg-red-400/10 text-red-500 rounded-lg border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
              )}
              {toast.type === 'started' && (
                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 animate-pulse">
                  <Wifi className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1 select-none">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest font-mono block">
                {toast.type === 'completed' ? 'Download Complete' : 
                 toast.type === 'failed' ? 'Transfer Interrupted' : 'Transfer Started'}
              </span>
              <h4 className="text-xs font-bold text-zinc-200 mt-1 truncate" title={toast.fileName}>
                {toast.fileName}
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                {toast.type === 'completed' ? `Successfully saved (${toast.size})` :
                 toast.type === 'failed' ? 'Direct socket channel closed' : `Piping chunk streams (${toast.size})`}
              </p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.04] transition self-start cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
