import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Wifi, WifiOff, Folder, File, Download, Send, Trash2, 
  Settings, Star, CheckSquare, Square, Lock, Shield, MoreVertical, 
  ArrowLeft, Battery, Signal, RefreshCw, Play, CheckCircle2, HardDrive, 
  X, Info, Copy, Edit2, Search, Plus, List, Grid, ShieldAlert,
  Sliders, Terminal, Bluetooth, Laptop, Server, HelpCircle, History
} from 'lucide-react';
import { Device, FileItem, TransferItem, AppSettings } from '../types';
import { mockFileSystems } from '../mockData';

interface AndroidCompanionAppProps {
  devices: Device[];
  onPairNewDevice: (newDevice: Device) => void;
  onRevokeDeviceTrust: (deviceId: string) => void;
  onRemoveDevice: (deviceId: string) => void;
  transfers: TransferItem[];
  onTriggerTransfer: (fileName: string, size: string, direction: 'incoming' | 'outgoing', peerDevice: string) => void;
  setTransfers: React.Dispatch<React.SetStateAction<TransferItem[]>>;
  favorites: string[];
  onToggleFavorite: (filePath: string) => void;
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
}

export default function AndroidCompanionApp({
  devices,
  onPairNewDevice,
  onRevokeDeviceTrust,
  onRemoveDevice,
  transfers,
  onTriggerTransfer,
  setTransfers,
  favorites,
  onToggleFavorite,
  setDevices
}: AndroidCompanionAppProps) {
  
  // Interactive Android App State Controlleres
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'dashboard' | 'nearby' | 'files' | 'transfers' | 'settings'>('splash');
  const [selectedMobilePath, setSelectedMobilePath] = useState<string>('Pixel 8 Pro\\Internal Storage');
  const [mobileFiles, setMobileFiles] = useState<Record<string, FileItem[]>>(mockFileSystems);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [discoveryActive, setDiscoveryActive] = useState<boolean>(true);
  const [isConnectingDevice, setIsConnectingDevice] = useState<string | null>(null);
  
  // Pairing PIN Handshake Prompt state
  const [pairingHandshake, setPairingHandshake] = useState<{
    visible: boolean;
    device: Device | null;
    pin: string;
  }>({
    visible: false,
    device: null,
    pin: '',
  });

  // Hot toast notification system
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Quick shortcut types
  type MobileFolderType = 'Download' | 'DCIM' | 'Documents' | 'Music' | 'Favorites' | 'Received';

  // Local File Action Dialogs
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('4.2 MB');
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameText, setRenameText] = useState('');

  // Local mobile UI status states
  const [broadcastDiscoverable, setBroadcastDiscoverable] = useState(true);
  const [autoAcceptIncoming, setAutoAcceptIncoming] = useState(false);
  const [channelPort, setChannelPort] = useState(5353);

  // Time tracker for simulated status bar
  const [simulatedTime, setSimulatedTime] = useState('19:18');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setSimulatedTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // Simulate Splash Screen timing
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        setCurrentScreen('dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item: FileItem | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  });

  // Handle outside clicks to close lists or menus
  useEffect(() => {
    const handleOutsideClick = () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch current phone file elements
  const currentPathFiles = mobileFiles[selectedMobilePath] || [];

  // Filter with search criteria
  const filteredFiles = currentPathFiles.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick category navigation
  const handleMobileQuickAccess = (folder: MobileFolderType) => {
    if (folder === 'Favorites') {
      // Find all favorited elements
      setSelectedMobilePath('Favorites');
      setSelectedPaths([]);
      return;
    }
    if (folder === 'Received') {
      setSelectedMobilePath('Pixel 8 Pro\\Internal Storage\\Download');
      setSelectedPaths([]);
      triggerToast('Showing recent incoming files');
      return;
    }
    const resolvedPath = `Pixel 8 Pro\\Internal Storage\\${folder}`;
    setSelectedMobilePath(resolvedPath);
    setSelectedPaths([]);
  };

  // Helper for file type icons
  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Folder className="w-5 h-5 fill-indigo-400/20" />
        </div>
      );
    }
    switch (file.type) {
      case 'image':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <span className="text-[10px]">IMG</span>
          </div>
        );
      case 'video':
        return (
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <span className="text-[10px]">VID</span>
          </div>
        );
      case 'audio':
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <span className="text-[10px]">AUD</span>
          </div>
        );
      case 'pdf':
        return (
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <span className="text-[10px]">PDF</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <span className="text-[10px]">DOC</span>
          </div>
        );
    }
  };

  // Create folder inside interactive phone state
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: FileItem = {
      name: newFolderName.trim(),
      path: `${selectedMobilePath}\\${newFolderName.trim()}`,
      isDirectory: true,
      type: 'folder',
      lastModified: 'Just now',
      childCount: 0
    };
    
    setMobileFiles(prev => ({
      ...prev,
      [selectedMobilePath]: [...(prev[selectedMobilePath] || []), newFolder],
      [`${selectedMobilePath}\\${newFolderName.trim()}`]: []
    }));

    setNewFolderName('');
    setShowNewFolderModal(false);
    triggerToast(`Created folder "${newFolder.name}"`);
  };

  // Create document file stub inside phone state
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const fileExtension = newFileName.includes('.') ? '' : '.txt';
    const finalName = newFileName.trim() + fileExtension;
    
    // Auto map Type suffix label
    let fileType: FileItem['type'] = 'document';
    if (finalName.endsWith('.jpg') || finalName.endsWith('.png') || finalName.endsWith('.jpeg')) fileType = 'image';
    else if (finalName.endsWith('.mp4') || finalName.endsWith('.mov')) fileType = 'video';
    else if (finalName.endsWith('.mp3')) fileType = 'audio';
    else if (finalName.endsWith('.pdf')) fileType = 'pdf';

    const newFile: FileItem = {
      name: finalName,
      path: `${selectedMobilePath}\\${finalName}`,
      isDirectory: false,
      size: newFileSize,
      type: fileType,
      lastModified: 'Just now',
    };

    setMobileFiles(prev => ({
      ...prev,
      [selectedMobilePath]: [...(prev[selectedMobilePath] || []), newFile]
    }));

    setNewFileName('');
    setShowNewFileModal(false);
    triggerToast(`Created code target "${finalName}"`);
  };

  // Perform item deletion
  const handleDeleteItem = (targetItem: FileItem) => {
    const list = mobileFiles[selectedMobilePath] || [];
    setMobileFiles(prev => ({
      ...prev,
      [selectedMobilePath]: list.filter(item => item.path !== targetItem.path)
    }));
    setSelectedPaths(prev => prev.filter(p => p !== targetItem.path));
    triggerToast(`Deleted permanent storage block: ${targetItem.name}`);
  };

  // Finalize Rename process
  const handleRenameSubmit = () => {
    if (!renameTarget || !renameText.trim()) return;
    const originalPath = renameTarget.path;
    const list = mobileFiles[selectedMobilePath] || [];
    
    const updatedList = list.map(item => {
      if (item.path === originalPath) {
        const pathParts = item.path.split('\\');
        pathParts[pathParts.length - 1] = renameText.trim();
        const newPath = pathParts.join('\\');
        return {
          ...item,
          name: renameText.trim(),
          path: newPath
        };
      }
      return item;
    });

    setMobileFiles(prev => ({
      ...prev,
      [selectedMobilePath]: updatedList
    }));

    setRenameTarget(null);
    setRenameText('');
    triggerToast('Metadata field renamed successfully!');
  };

  // Send selected items to computer (Simulated Bridge Transfer)
  const handleSendSelectedToPC = (itemsToSend: FileItem[]) => {
    if (itemsToSend.length === 0) {
      triggerToast('No items selected to broadcast');
      return;
    }
    
    // Broadcast transfer stream
    itemsToSend.forEach((item, index) => {
      // Simulate socket pipeline trigger
      setTimeout(() => {
        onTriggerTransfer(
          item.name, 
          item.size || '3.4 MB', 
          'outgoing', // Outgoing from Android, means Incoming to laptop
          'Pixel 8 Pro'
        );
      }, index * 400);
    });

    triggerToast(`Transfer pipe active: Sending ${itemsToSend.length} items to Laptop`);
    setCurrentScreen('transfers');
    setSelectedPaths([]);
  };

  // Confirm authorization connection PIN handshake
  const confirmChannelHandshake = () => {
    if (!pairingHandshake.device) return;
    const devId = pairingHandshake.device.id;
    
    setDevices(prev => prev.map(d => {
      if (d.id === devId) {
        return {
          ...d,
          isTrusted: true,
          status: 'online'
        };
      }
      return d;
    }));

    setPairingHandshake({ visible: false, device: null, pin: '' });
    triggerToast(`Symmetric pairing keys authorized! Device is now fully trusted.`);
  };

  // Initiate device connect request from local list
  const handleConnectRequest = (dev: Device) => {
    if (dev.isTrusted) {
      triggerToast(`${dev.name} is already a verified trust partner`);
      return;
    }

    setIsConnectingDevice(dev.id);
    setTimeout(() => {
      setIsConnectingDevice(null);
      // Generate standard 6-digit dynamic bridge pin
      const verificationPin = String(Math.floor(100000 + Math.random() * 900000));
      setPairingHandshake({
        visible: true,
        device: dev,
        pin: verificationPin
      });
    }, 1200);
  };

  return (
    /* PHONE SHELL WRAPPER Frame mimicking a realistic Bezel styled handset */
    <div className="w-[360px] h-[720px] bg-[#0c0d12] rounded-[3.2rem] border-[12px] border-[#1d1f27] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden text-zinc-100 select-none font-sans scale-100 ring-4 ring-white/[0.04] shrink-0">
      
      {/* Front camera hole punch notch cut */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-950 rounded-full z-50 border border-zinc-800 flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-blue-900/40 rounded-full animate-pulse" />
      </div>

      {/* Simulated Android Status Bar */}
      <div className="h-9 bg-[#0c0d12] px-6 flex items-center justify-between text-[11px] font-mono text-zinc-400 font-bold tracking-wider z-40 select-none shrink-0">
        <div>{simulatedTime}</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-semibold hidden min-[320px]:inline">5G</span>
          <Signal className="w-3.5 h-3.5 text-zinc-400" />
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-400 font-bold">84%</span>
            <Battery className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
          </div>
        </div>
      </div>

      {/* COMPANION SCREENS VIEWPORT */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#12131a] relative z-20">
        
        {/* VIEW: Splash Screen */}
        {currentScreen === 'splash' && (
          <div className="absolute inset-0 bg-[#0c0d12] flex flex-col items-center justify-between py-16 px-6 z-50 animate-fade-in text-center">
            <div />
            <div className="flex flex-col items-center gap-5">
              {/* Dynamic glowing brand token wrapper */}
              <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-600/10 relative">
                <div className="absolute inset-0 rounded-3xl border border-dashed border-indigo-500/40 animate-spin" style={{ animationDuration: '10s' }} />
                <Smartphone className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider text-white">FileBridge Mobile</h1>
                <span className="text-[11px] uppercase tracking-widest text-indigo-400 font-black font-semibold block mt-1.5">Android Client</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
              <p className="text-[10px] font-mono text-zinc-600">Initializing Secure TCP Bridge Daemon...</p>
            </div>
          </div>
        )}

        {/* VIEW: Home Dashboard Screen */}
        {currentScreen === 'dashboard' && (
          <div className="flex-1 flex flex-col min-h-0 p-5 overflow-y-auto space-y-5 scrollbar-thin">
            {/* Greeting and settings gear action */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block font-serif">Workspace</span>
                <h2 className="text-lg font-bold text-white tracking-tight">Pixel 8 Pro</h2>
              </div>
              <button 
                onClick={() => setCurrentScreen('settings')}
                className="w-9 h-9 bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:text-white transition rounded-xl flex items-center justify-center cursor-pointer text-zinc-400"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Discoverability Broadcaster Card */}
            <div className="p-4 rounded-3xl bg-[#1a1b26] border border-white/5 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold text-zinc-200">Bridge Discovery active</span>
                </div>
                <span className="text-[9px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded-full font-bold font-mono">
                  PORT: {channelPort}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Laptop detects this phone as <strong className="text-zinc-200 font-semibold font-mono">Pixel 8 Pro</strong> on subnet IP <strong className="text-indigo-400 font-semibold font-mono">192.168.1.142</strong>.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentScreen('nearby')}
                  className="flex-1 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Scan Machines</span>
                </button>
                <button 
                  onClick={() => setCurrentScreen('files')}
                  className="px-4 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 transition font-semibold text-xs cursor-pointer text-zinc-300"
                >
                  My Files
                </button>
              </div>
            </div>

            {/* M3 Round Circle Storage Footprint Indicator Map */}
            <div className="p-4 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                  <circle cx="32" cy="32" r="26" className="stroke-indigo-500" strokeWidth="6" fill="transparent" 
                    strokeDasharray="163" strokeDashoffset="81" /* 50% storage footprint simulation */
                  />
                </svg>
                <div className="absolute text-[10px] font-mono font-bold text-white">50%</div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-200">Internal Storage</h3>
                <p className="text-[10px] text-zinc-400">
                  <strong className="text-white font-mono">128 GB</strong> used of 256 GB total
                </p>
                <span className="block text-[9px] text-indigo-400 font-semibold uppercase">Category allocation map: Normal</span>
              </div>
            </div>

            {/* Quick Access category launcher layout */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Local Categories</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { folder: 'Download' as MobileFolderType, label: 'Downloads', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                  { folder: 'DCIM' as MobileFolderType, label: 'Photos / Camera', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
                  { folder: 'Documents' as MobileFolderType, label: 'Documents', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
                  { folder: 'Music' as MobileFolderType, label: 'Music Beats', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                  { folder: 'Favorites' as MobileFolderType, label: 'Favorites', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                  { folder: 'Received' as MobileFolderType, label: 'Received Files', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      handleMobileQuickAccess(item.folder);
                      setCurrentScreen('files');
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition group hover:scale-[1.02] cursor-pointer ${item.color}`}
                  >
                    <Folder className="w-4 h-4 fill-current opacity-70 group-hover:opacity-100" />
                    <span className="text-[11px] font-bold tracking-tight text-white">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active System logs dashboard list item summary count */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Active Queue</span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {transfers.filter(t => t.status === 'running' || t.status === 'waiting').length} tasks
              </span>
            </div>
          </div>
        )}

        {/* VIEW: Nearby Discovery & Verified Trust screen */}
        {currentScreen === 'nearby' && (
          <div className="flex-1 flex flex-col min-h-0 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentScreen('dashboard')}
                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">P2P Network Node</h2>
            </div>

            {/* Radar scanner visual effect */}
            <div className="p-4 rounded-3xl bg-[#141520] border border-white/5 flex flex-col items-center py-6 text-center shadow-lg relative overflow-hidden">
              <div className="w-14 h-14 rounded-full bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 relative mb-3">
                <div className="absolute inset-0 rounded-full border border-indigo-500/20 scale-150 animate-ping" />
                <Bluetooth className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xs font-bold text-zinc-200">WiFi Socket Node Broadcaster</h3>
              <p className="text-[11px] text-zinc-500 max-w-xs mt-1 leading-relaxed">
                Auto searching for trusted clients on local network gateway. Make sure client services are active.
              </p>
            </div>

            {/* Nearby detected / paired list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Local machines list</span>
                <button 
                  onClick={() => {
                    setDiscoveryActive(!discoveryActive);
                    triggerToast(discoveryActive ? 'Paused subnet discovery scan' : 'Fired high-frequency socket discovery scan');
                  }}
                  className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 hover:text-white transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${discoveryActive ? 'animate-spin' : ''}`} />
                  <span>{discoveryActive ? 'Scanning' : 'Resume Scan'}</span>
                </button>
              </div>

              {devices.filter(d => d.type === 'windows').map((dev) => (
                <div 
                  key={dev.id}
                  className="p-3.5 rounded-2.5xl bg-zinc-900 border border-white/5 hover:border-white/10 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-indigo-400 border border-white/5">
                      {dev.category === 'desktop' ? <Server className="w-5 h-5 text-indigo-400" /> : <Laptop className="w-5 h-5 text-sky-400" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{dev.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{dev.ipAddress}</p>
                    </div>
                  </div>

                  <div>
                    {dev.isTrusted ? (
                      <span className="p-1 px-2 text-[9px] bg-emerald-550/15 text-emerald-400 border border-emerald-500/25 rounded-xl font-bold flex items-center gap-1 font-mono uppercase">
                        <Shield className="w-2.5 h-2.5" />
                        <span>Trusted</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnectRequest(dev)}
                        disabled={isConnectingDevice === dev.id}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 text-white rounded-xl text-[10px] font-bold tracking-tight transition cursor-pointer font-serif uppercase shadow"
                      >
                        {isConnectingDevice === dev.id ? 'Connecting...' : 'Authorize Trust'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: Material You Device File Browser Screen */}
        {currentScreen === 'files' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#12131a]">
            {/* Header Path Navigation context */}
            <div className="p-4 border-b border-white/5 bg-[#161722] flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between pr-1">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (selectedMobilePath === 'Pixel 8 Pro\\Internal Storage') {
                        setCurrentScreen('dashboard');
                      } else {
                        // Go one path level up
                        const segmentParts = selectedMobilePath.split('\\');
                        segmentParts.pop();
                        const upPath = segmentParts.join('\\');
                        setSelectedMobilePath(upPath);
                        setSelectedPaths([]);
                      }
                    }}
                    className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition flex items-center justify-center cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Storage Explorer</span>
                </div>
                
                {/* Visual grid / list slider switch */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setIsGridView(!isGridView)}
                    className="p-1 text-zinc-500 hover:text-white transition"
                    title={isGridView ? "List View" : "Grid View"}
                  >
                    {isGridView ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Path Breadcrumb container */}
              <div className="text-[11px] font-mono text-zinc-400 select-all truncate bg-zinc-950/50 p-2 rounded-xl text-left border border-white/5">
                📁 {selectedMobilePath.replace('Pixel 8 Pro\\Internal Storage', 'Storage')}
              </div>

              {/* Internal Actions toolbar row */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex gap-1">
                  <button 
                    onClick={() => setShowNewFolderModal(true)}
                    className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 hover:border-indigo-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Folder</span>
                  </button>
                  <button 
                    onClick={() => setShowNewFileModal(true)}
                    className="p-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/10 hover:border-emerald-500/20 rounded-xl text-[10px] font-bold flex items-center gap-1 transition cursor-pointer hover:text-emerald-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>File Stub</span>
                  </button>
                </div>
                
                {selectedPaths.length > 0 && (
                  <button 
                    onClick={() => {
                      const selItems = currentPathFiles.filter(f => selectedPaths.includes(f.path));
                      handleSendSelectedToPC(selItems);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Transmit ({selectedPaths.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Middle Search Input row */}
            <div className="px-4 py-2 bg-zinc-950/40 border-b border-white/5 flex items-center gap-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search storage container..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-0 w-full p-0.5"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Folder Catalog Body viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              
              {selectedMobilePath === 'Favorites' ? (
                /* Favorites virtual category */
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">My Stars</span>
                  {favorites.length === 0 ? (
                    <div className="text-center py-10 text-zinc-650 text-xs">No starred item markers defined.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.values(mobileFiles).flat() as FileItem[])
                        .filter((item: FileItem, idx: number, self: FileItem[]) => 
                          (favorites.includes(item.path) || item.isFavorite) &&
                          self.findIndex((t: FileItem) => t.path === item.path) === idx
                        )
                        .map(favoriteFile => (
                          <div 
                            key={favoriteFile.path}
                            className="p-3 bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-2.5"
                          >
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-xs truncate text-zinc-200">{favoriteFile.name}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : filteredFiles.length === 0 ? (
                /* Empty directory block */
                <div className="h-full flex flex-col items-center justify-center text-center py-20 select-none">
                  <div className="p-3 bg-zinc-900 border border-dashed border-white/5 rounded-full text-zinc-650 mb-3 animate-pulse">
                    <Folder className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-300">No mock files detected</h3>
                  <p className="text-[11px] text-zinc-500 max-w-[200px] mt-1.5 leading-relaxed">
                    Tap the actions bar controls above to trigger file node templates.
                  </p>
                </div>
              ) : isGridView ? (
                /* GRID View representation */
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedPaths.includes(file.path);
                    return (
                      <div 
                        key={file.path}
                        onClick={() => {
                          setSelectedPaths(prev => 
                            prev.includes(file.path)
                              ? prev.filter(p => p !== file.path)
                              : [...prev, file.path]
                          );
                        }}
                        onDoubleClick={() => {
                          if (file.isDirectory) {
                            setSelectedMobilePath(file.path);
                            setSelectedPaths([]);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between h-32 transition relative ${
                          isSelected
                            ? 'bg-indigo-600/10 border-indigo-500/40'
                            : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/70 hover:border-white/10'
                        }`}
                      >
                        {/* Selector checkbox upper left corner bubble */}
                        <div className="absolute top-2 left-2 z-10 w-4 h-4">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400 fill-indigo-400/10" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                          )}
                        </div>

                        {/* Top corner action dots */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({
                              visible: true,
                              x: e.clientX,
                              y: e.clientY,
                              item: file
                            });
                          }}
                          className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white transition rounded-full hover:bg-white/5 cursor-pointer z-10"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        <div className="h-12 flex items-center justify-center mt-3">
                          {getFileIcon(file)}
                        </div>

                        <div className="w-full mt-2.5">
                          <p className="text-[11px] font-bold truncate text-zinc-200" title={file.name}>
                            {file.name}
                          </p>
                          <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
                            {file.isDirectory ? `${file.childCount || 0} items` : (file.size || '4 MB')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* LIST View representation */
                <div className="space-y-2 pb-6">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedPaths.includes(file.path);
                    return (
                      <div 
                        key={file.path}
                        onClick={() => {
                          setSelectedPaths(prev => 
                            prev.includes(file.path)
                              ? prev.filter(p => p !== file.path)
                              : [...prev, file.path]
                          );
                        }}
                        onDoubleClick={() => {
                          if (file.isDirectory) {
                            setSelectedMobilePath(file.path);
                            setSelectedPaths([]);
                          }
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-indigo-600/10 border-indigo-500/40'
                            : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/70 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="truncate text-left">
                            <h4 className="text-xs font-bold text-zinc-200 truncate">{file.name}</h4>
                            <p className="text-[9px] font-mono text-zinc-500 font-bold tracking-wider mt-0.5 uppercase">
                              {file.isDirectory ? `${file.childCount} folders` : (file.size || '3.4 MB')} • {file.lastModified}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({
                              visible: true,
                              x: e.clientX,
                              y: e.clientY,
                              item: file
                            });
                          }}
                          className="p-1 text-zinc-500 hover:text-white transition rounded-full hover:bg-white/5 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: Bottom Tab Active Transfer Queue Screen */}
        {currentScreen === 'transfers' && (
          <div className="flex-1 flex flex-col min-h-0 p-5 space-y-4">
            <div className="flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block font-serif">Pipe stats</span>
                <h2 className="text-lg font-bold text-white tracking-tight">Sync Stream Queue</h2>
              </div>
              
              <button 
                onClick={() => {
                  setTransfers([]);
                  triggerToast('Cleared transfer log database');
                }}
                className="p-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:text-white text-zinc-400 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition uppercase"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Clear queue</span>
              </button>
            </div>

            {/* Transfer queue items list mapping */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {transfers.length === 0 ? (
                <div className="text-center py-24 select-none">
                  <div className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 inline-block mb-3 animate-pulse">
                    <RefreshCw className="w-8 h-8" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-300">FileBridge Pipe Clear</h3>
                  <p className="text-[11px] text-zinc-500 max-w-sm mt-1.5 leading-relaxed">
                    No active WiFi transfers running. Go to `Storage File Browser` to transmit items dynamically.
                  </p>
                </div>
              ) : (
                transfers.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-2.5xl bg-zinc-900 border border-white/5 space-y-3 relative overflow-hidden"
                  >
                    {/* Direction label token background overlay indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          item.status === 'completed' ? 'bg-emerald-500' :
                          item.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500 animate-pulse'
                        }`} />
                        <h4 className="text-xs font-bold text-zinc-200 truncate pr-2" title={item.fileName}>
                          {item.fileName}
                        </h4>
                      </div>
                      
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                        item.direction === 'outgoing' 
                          ? 'bg-blue-950/80 text-blue-400 border border-blue-500/10' 
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {item.direction === 'outgoing' ? '↓ Outgoing' : '↑ Incoming'}
                      </span>
                    </div>

                    {/* Progress Slider Track styling */}
                    <div className="space-y-1">
                      <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'completed' ? 'bg-emerald-500' :
                            item.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500 animate-pulse'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 font-semibold uppercase">
                        <span>{item.size} • {item.progress}%</span>
                        <span className="text-zinc-400">{item.status === 'running' ? `${item.speed} • ETA ${item.eta}` : item.status.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW: Tablet/Companion Settings Screen */}
        {currentScreen === 'settings' && (
          <div className="flex-1 flex flex-col min-h-0 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentScreen('dashboard')}
                className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Companion Settings</h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin pb-6 text-left">
              {/* Category: Networking */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider px-1">Network Socket Rules</span>
                
                <div className="p-3.5 rounded-2.5xl bg-zinc-900 border border-white/5 space-y-4">
                  {/* Discovery Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Broadcast Discovery</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Advertise discoverability to local PCs</p>
                    </div>
                    <button 
                      onClick={() => setBroadcastDiscoverable(!broadcastDiscoverable)}
                      className={`w-11 h-6 rounded-full transition relative flex items-center ${broadcastDiscoverable ? 'bg-indigo-600' : 'bg-zinc-850'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${broadcastDiscoverable ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Auto Accept */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Auto-accept Transfers</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Allow incoming streams without handshakes</p>
                    </div>
                    <button 
                      onClick={() => setAutoAcceptIncoming(!autoAcceptIncoming)}
                      className={`w-11 h-6 rounded-full transition relative flex items-center ${autoAcceptIncoming ? 'bg-indigo-600' : 'bg-zinc-850'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${autoAcceptIncoming ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Port select */}
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase">Bridge Broadcast Port</label>
                    <input 
                      type="number" 
                      value={channelPort}
                      onChange={(e) => setChannelPort(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Category: Hardware Properties */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider px-1">Hardware specs (Sim)</span>
                
                <div className="p-3.5 rounded-2.5xl bg-zinc-800/40 border border-white/5 space-y-2.5 font-mono text-[10px] text-zinc-400">
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <strong className="text-zinc-200">Google Pixel 8 Pro</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>OS Platform:</span>
                    <strong className="text-emerald-400">Android 16 DP</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Wireless NIC:</span>
                    <strong className="text-zinc-250">802.11 ax (Wi-Fi 7)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Mac ID Address:</span>
                    <strong className="text-zinc-300">00:80:41:ae:fd:7e</strong>
                  </div>
                </div>
              </div>

              {/* Reset simulator Button */}
              <button 
                onClick={() => {
                  setMobileFiles(mockFileSystems);
                  triggerToast('Recompiled mobile virtual storage paths!');
                }}
                className="w-full py-2.5 rounded-2.5xl border border-dashed border-red-500/20 hover:border-red-500/40 bg-red-500/10 text-red-400 font-semibold text-xs transition text-center cursor-pointer uppercase tracking-wide"
              >
                Reset Mobile Files Cache
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MATERIAL 3 TACTILE SYSTEM BOTTOM NAVIGATION BAR */}
      {currentScreen !== 'splash' && (
        <div className="h-16 bg-[#0c0d12] border-t border-white/5 px-4 flex items-center justify-around z-40 shrink-0">
          {[
            { screen: 'dashboard' as const, label: 'Home', icon: Smartphone },
            { screen: 'nearby' as const, label: 'Nearby', icon: Wifi },
            { screen: 'files' as const, label: 'Files', icon: Folder },
            { screen: 'transfers' as const, label: 'Transfers', icon: RefreshCw },
          ].map((tab) => {
            const isActive = currentScreen === tab.screen || (tab.screen === 'files' && currentScreen === 'files');
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setCurrentScreen(tab.screen);
                  setSelectedPaths([]);
                }}
                className="flex flex-col items-center gap-1 py-1 cursor-pointer group"
                style={{ width: '4.5rem' }}
              >
                <div className={`h-8 w-11 rounded-3xl flex items-center justify-center transition-all duration-200 relative ${
                  isActive ? 'bg-indigo-600 text-white hover:bg-indigo-500 font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                  <tab.icon className="w-4.5 h-4.5" />
                </div>
                <span className={`text-[9px] tracking-wide transition-all ${isActive ? 'text-white font-bold' : 'text-zinc-500 font-medium group-hover:text-zinc-300'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* TOAST SYSTEM POPUP Overlay */}
      {toast && (
        <div className="absolute bottom-20 left-4 right-4 bg-[#1f202b] border border-white/10 text-zinc-100 rounded-2xl px-4 py-3 text-left shadow-2xl flex items-center gap-2.5 text-xs z-50 animate-fade-in">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate leading-relaxed">{toast}</span>
        </div>
      )}

      {/* DIALOG 1: Mobile Create Folder */}
      {showNewFolderModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowNewFolderModal(false)}>
          <div className="w-full bg-[#161722] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>Create New Folder</span>
            </h3>
            <input 
              type="text" 
              placeholder="Folder designation..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowNewFolderModal(false)}
                className="flex-1 py-2 rounded-2xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                onClick={handleCreateFolder}
                className="flex-1 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow hover:shadow-lg transition cursor-pointer"
              >
                Provision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 2: Mobile Create File Stub */}
      {showNewFileModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowNewFileModal(false)}>
          <div className="w-full bg-[#161722] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <File className="w-4 h-4 text-emerald-400" />
              <span>Create Mock File Node</span>
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono block mb-1">File Name</label>
                <input 
                  type="text" 
                  placeholder="photo_trip.jpg, doc_contract.pdf etc..."
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-4 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono block mb-1">File Size</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1.2 MB, 45 KB"
                  value={newFileSize}
                  onChange={(e) => setNewFileSize(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-4 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowNewFileModal(false)}
                className="flex-1 py-2 rounded-2xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                onClick={handleCreateFile}
                className="flex-1 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow hover:shadow-lg transition cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 3: Peer PIN Verification handshake popup */}
      {pairingHandshake.visible && pairingHandshake.device && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full bg-[#181926] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Device Pair Handshake</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Confirm compatibility PIN trace displayed on computer <strong className="text-zinc-200 font-semibold">{pairingHandshake.device.name}</strong> to build the secure client socket link.
              </p>
            </div>

            {/* Displaying verification code digits */}
            <div className="bg-zinc-950/80 border border-white/5 py-3.5 rounded-2.5xl tracking-[0.25em] font-mono text-lg font-black text-indigo-400 text-center select-all">
              {pairingHandshake.pin}
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => setPairingHandshake({ visible: false, device: null, pin: '' })}
                className="flex-1 py-2.5 rounded-2.5xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold hover:border-white/10 transition cursor-pointer"
              >
                Reject PIN
              </button>
              <button 
                onClick={confirmChannelHandshake}
                className="flex-1 py-2.5 rounded-2.5xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg hover:shadow-indigo-600/20 transition cursor-pointer"
              >
                Verify Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 4: Rename Property Prompt */}
      {renameTarget && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setRenameTarget(null)}>
          <div className="w-full bg-[#161722] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-400" />
              <span>Rename Item</span>
            </h3>
            <input 
              type="text" 
              placeholder={renameTarget.name}
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setRenameTarget(null)}
                className="flex-1 py-2 rounded-2xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                onClick={handleRenameSubmit}
                className="flex-1 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOAT RETAIL HANDSET RIGHT-CLICK CONTEXT MENU OVERLAY */}
      {contextMenu.visible && contextMenu.item && (
        <div 
          className="absolute z-[100] min-w-[160px] max-w-[220px] bg-[#1d1f27]/95 backdrop-blur-lg border border-white/10 rounded-2xl p-1 shadow-2xl text-xs text-zinc-200 font-sans"
          style={{
            left: `${Math.min(contextMenu.x - 40, 160)}px`,
            top: `${Math.min(contextMenu.y - 120, 480)}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header context target filename preview */}
          <div className="px-2 py-1 border-b border-white/5 mb-1 text-[9px] text-zinc-500 font-bold truncate">
            {contextMenu.item.name}
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => {
                if (contextMenu.item) {
                  handleSendSelectedToPC([contextMenu.item]);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-250 hover:text-white transition text-left cursor-pointer font-medium"
            >
              <Send className="w-3 h-3 text-indigo-400" />
              <span>Send To Computer</span>
            </button>

            <button
              onClick={() => {
                if (contextMenu.item) {
                  setRenameTarget(contextMenu.item);
                  setRenameText(contextMenu.item.name);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-250 hover:text-white transition text-left cursor-pointer font-medium"
            >
              <Edit2 className="w-3 h-3 text-blue-400" />
              <span>Rename Target</span>
            </button>

            <button
              onClick={() => {
                if (contextMenu.item) {
                  onToggleFavorite(contextMenu.item.path);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                  triggerToast(favorites.includes(contextMenu.item.path) ? "Removed from Star bookmarks" : "Added to Star bookmarks");
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-250 hover:text-white transition text-left cursor-pointer font-medium"
            >
              <Star className={`w-3 h-3 ${favorites.includes(contextMenu.item.path) ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
              <span>Bookmark Star</span>
            </button>

            <button
              onClick={() => {
                if (contextMenu.item) {
                  navigator.clipboard.writeText(contextMenu.item.path);
                  triggerToast("Mobile path copied!");
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-250 hover:text-white transition text-left cursor-pointer font-medium"
            >
              <Copy className="w-3 h-3 text-zinc-500" />
              <span>Copy Path trace</span>
            </button>

            <div className="h-[1px] bg-white/5 my-1" />

            <button
              onClick={() => {
                if (contextMenu.item) {
                  handleDeleteItem(contextMenu.item);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition text-left cursor-pointer font-bold"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span>Delete file</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
