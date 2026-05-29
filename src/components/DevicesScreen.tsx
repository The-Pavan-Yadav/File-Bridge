import React, { useState } from 'react';
import { 
  Laptop, Smartphone, Tablet, Monitor, Plus, RefreshCw, CheckCircle, 
  ShieldAlert, Wifi, HardDrive, Shield, KeyRound, Search, Trash2, 
  ArrowRight, Battery, BatteryCharging, Info, X, Check, Send, 
  ExternalLink, Network, Radio, HelpCircle, FileText, Image as ImageIcon, Video as VideoIcon, CheckCircle2
} from 'lucide-react';
import { Device, AppSettings } from '../types';

interface DevicesScreenProps {
  devices: Device[];
  onBrowseDeviceFiles: (deviceName: string) => void;
  onPairNewDevice: (newDevice: Device) => void;
  onRevokeDeviceTrust: (deviceId: string) => void;
  onRemoveDevice: (deviceId: string) => void;
  onTriggerTransfer: (fileName: string, size: string, direction: 'incoming' | 'outgoing', peerDevice: string) => void;
  discoveryError?: string | null;
  isScanning?: boolean;
  onManualTriggerScan?: () => void;
  settings?: AppSettings;
}

export default function DevicesScreen({
  devices,
  onBrowseDeviceFiles,
  onPairNewDevice,
  onRevokeDeviceTrust,
  onRemoveDevice,
  onTriggerTransfer,
  discoveryError,
  isScanning: propIsScanning,
  onManualTriggerScan,
  settings,
}: DevicesScreenProps) {
  const [localIsScanning, setLocalIsScanning] = useState(false);
  const isScanning = propIsScanning !== undefined ? propIsScanning : localIsScanning;
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Posting / Sharing details info panel state
  const [selectedInfoDevice, setSelectedInfoDevice] = useState<Device | null>(null);
  const [showSendMenuForDeviceId, setShowSendMenuForDeviceId] = useState<string | null>(null);

  // Send Files Workflow States
  const [pendingTransferFiles, setPendingTransferFiles] = useState<{ name: string; size: string }[]>([]);
  const [pendingTransferDevice, setPendingTransferDevice] = useState<Device | null>(null);
  const [dragOverDeviceId, setDragOverDeviceId] = useState<string | null>(null);

  const handleFileSelectionChange = (e: React.ChangeEvent<HTMLInputElement>, device: Device) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedList: { name: string; size: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeInMB = file.size / (1024 * 1024);
      const formattedSize = sizeInMB > 1 
        ? `${sizeInMB.toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(1)} KB`;

      selectedList.push({
        name: file.name,
        size: formattedSize
      });
    }

    setPendingTransferFiles(selectedList);
    setPendingTransferDevice(device);
  };

  const handleDragOver = (e: React.DragEvent, deviceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDeviceId(deviceId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDeviceId(null);
  };

  const handleDrop = (e: React.DragEvent, device: Device) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDeviceId(null);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const selectedList: { name: string; size: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeInMB = file.size / (1024 * 1024);
      const formattedSize = sizeInMB > 1 
        ? `${sizeInMB.toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(1)} KB`;

      selectedList.push({
        name: file.name,
        size: formattedSize
      });
    }

    setPendingTransferFiles(selectedList);
    setPendingTransferDevice(device);
  };

  const getPendingTotalSize = () => {
    let totalMB = 0;
    pendingTransferFiles.forEach(f => {
      const isMB = f.size.toUpperCase().includes('MB');
      const isKB = f.size.toUpperCase().includes('KB');
      const val = parseFloat(f.size) || 0;
      if (isMB) {
        totalMB += val;
      } else if (isKB) {
        totalMB += val / 1024;
      }
    });

    if (totalMB > 1) {
      return `${totalMB.toFixed(1)} MB`;
    } else {
      return `${(totalMB * 1024).toFixed(1)} KB`;
    }
  };

  const handleConfirmTransfer = () => {
    if (!pendingTransferDevice) return;
    
    pendingTransferFiles.forEach(f => {
      onTriggerTransfer(f.name, f.size, 'outgoing', pendingTransferDevice.name);
    });

    const count = pendingTransferFiles.length;
    setPendingTransferFiles([]);
    setPendingTransferDevice(null);
    triggerToast(`Sent ${count} file${count > 1 ? 's' : ''} to ${pendingTransferDevice.name}!`);
  };
  
  // Toast notifications for instant actions
  const [showToastNotification, setShowToastNotification] = useState<string | null>(null);

  // Interactive Pairing Wizard Modal State
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingStep, setPairingStep] = useState(1); // 1 = Find local devices, 2 = Pin challenge
  const [detectedDevices, setDetectedDevices] = useState<any[]>([
    { name: 'Redmi Note 13 Pro', ip: '192.168.1.201', category: 'phone', loading: false },
    { name: 'Surface Pro 9 Tablet', ip: '192.168.1.115', category: 'tablet', loading: false }
  ]);
  const [selectedDetectedDevice, setSelectedDetectedDevice] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('4821');

  // Trigger scanning animation
  const handleRefreshScan = () => {
    if (onManualTriggerScan) {
      onManualTriggerScan();
    } else {
      setLocalIsScanning(true);
      setTimeout(() => {
        setLocalIsScanning(false);
        triggerToast('Localsubnet mDNS nodes up to date!');
      }, 2000);
    }
  };

  const handleStartPairing = () => {
    setShowPairingModal(true);
    setPairingStep(1);
    setSelectedDetectedDevice(detectedDevices[0]);
  };

  const handleCompletePairing = () => {
    if (!selectedDetectedDevice) return;
    
    // Determine default icon categories
    const isWin = selectedDetectedDevice.name.includes('Surface');
    const newPairedDevice: Device = {
      id: `dev-${Date.now()}`,
      name: selectedDetectedDevice.name,
      type: isWin ? 'windows' : 'android',
      category: selectedDetectedDevice.category,
      batteryPercentage: 78,
      connectionQuality: 'Excellent',
      lastSeen: 'Active now',
      ipAddress: selectedDetectedDevice.ip,
      lastActive: 'Just now',
      status: 'online',
      isTrusted: settings?.autoTrustDevices !== false,
      storageFree: '54 GB',
      storageTotal: '128 GB',
      avatarColor: isWin 
        ? 'bg-pink-500/15 text-pink-400 border-pink-500/30' 
        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    };
    
    onPairNewDevice(newPairedDevice);
    setShowPairingModal(false);
    triggerToast(`Successfully paired device: ${selectedDetectedDevice.name}`);
  };

  const triggerToast = (msg: string) => {
    setShowToastNotification(msg);
    setTimeout(() => {
      setShowToastNotification(null);
    }, 3000);
  };

  // Preset file templates for quick "Send Files" transfers
  const quickShareFiles = [
    { name: 'Project_Outline.pdf', size: '1.8 MB', icon: <FileText className="w-3.5 h-3.5 text-red-400 animate-pulse" /> },
    { name: 'Holiday_Snapshot.jpg', size: '4.5 MB', icon: <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> },
    { name: 'Core_Teaser_Video.mp4', size: '24.0 MB', icon: <VideoIcon className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  const handleQuickSend = (device: Device, fileName: string, size: string) => {
    onTriggerTransfer(fileName, size, 'outgoing', device.name);
    setShowSendMenuForDeviceId(null);
    triggerToast(`File packet '${fileName}' is now queuing into Socket transfer streams!`);
  };

  // Storage parse percentage calculator helper (for drive meter UI block)
  const getStoragePercentage = (free: string, total: string) => {
    const parseVal = (str: string) => {
      const num = parseFloat(str.replace(/[^\d.]/g, '')) || 0;
      if (str.toUpperCase().includes('TB')) return num * 1024;
      return num;
    };
    const freeG = parseVal(free);
    const totalG = parseVal(total);
    if (totalG <= 0) return 0;
    const usedG = Math.max(0, totalG - freeG);
    return Math.round((usedG / totalG) * 100);
  };

  // Device category label text mapper
  const getCategoryLabel = (category: string | undefined, type: 'android' | 'windows') => {
    if (category) {
      if (category === 'phone') return 'Android Phone';
      if (category === 'desktop') return 'Windows PC';
      if (category === 'laptop') return 'Laptop';
      if (category === 'tablet') return 'Tablet';
    }
    return type === 'windows' ? 'Windows PC' : 'Android Device';
  };

  // Device category Lucide icon mapper
  const getDeviceIcon = (category: string | undefined, type: 'android' | 'windows') => {
    if (category) {
      if (category === 'phone') return Smartphone;
      if (category === 'tablet') return Tablet;
      if (category === 'laptop') return Laptop;
      if (category === 'desktop') return Monitor;
    }
    return type === 'windows' ? Laptop : Smartphone;
  };

  // Connection Quality color-coding builder
  const getConnectionQualityBadge = (quality: string | undefined) => {
    const q = quality || 'Good';
    const states = {
      Excellent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      Good: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      Fair: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Poor: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    const style = states[q as keyof typeof states] || states.Good;
    return (
      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1.5 ${style}`}>
        <Wifi className="w-2.5 h-2.5" />
        {q}
      </span>
    );
  };

  // Battery percentage UI badge helper
  const getBatteryBadge = (p: number | undefined) => {
    if (p === undefined) return null;
    let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    if (p <= 20) color = 'text-red-400 bg-red-500/10 border-red-500/25 animate-pulse';
    else if (p <= 55) color = 'text-amber-400 bg-amber-500/10 border-amber-500/25';

    return (
      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-medium flex items-center gap-1 shrink-0 ${color}`} title="Paired device battery level">
        <Battery className="w-3 h-3 text-current" />
        {p}%
      </span>
    );
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.ipAddress.includes(searchQuery)
  );

  // Group devices to layout trusted prominently
  const trustedPairedDevices = filteredDevices.filter(d => d.isTrusted && d.status !== 'offline');
  const availableDiscoverDevices = filteredDevices.filter(d => !d.isTrusted && d.status !== 'offline');
  const offlineDevices = filteredDevices.filter(d => d.status === 'offline');

  return (
    <div className="flex-1 flex overflow-hidden relative bg-zinc-900/40 text-zinc-100 font-sans">
      
      {/* Toast Notifications */}
      {showToastNotification && (
        <div className="absolute bottom-5 right-5 z-50 bg-zinc-950 border border-emerald-500/30 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in text-xs text-zinc-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>{showToastNotification}</span>
        </div>
      )}

      {/* LEFT CONTAINER (THE MAIN DEVICES HUB AREA) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Modern Title Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Devices &amp; Sharing
              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-sans tracking-wide px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1.5 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Nearby Share Active
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Connect to your nearby phones, tablets, or other computer systems to access their storage and share files easily.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-950/40 border border-white/8 hover:bg-white/10 text-xs font-semibold text-zinc-300 active:scale-98 transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-400' : ''}`} />
              {isScanning ? 'Searching...' : 'Scan Wi-Fi'}
            </button>
            
            <button
              onClick={handleStartPairing}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/15 active:scale-98 transition duration-150 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Pair New Device
            </button>
          </div>
        </div>

        {/* Dynamic Broadcast Radar */}
        {discoveryError && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between animate-fade-in shadow-inner text-red-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/25 shrink-0">
                <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-red-300">
                  Connection Unreachable
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Please check if your device is running the companion client. Automatic reconnect is active.</p>
              </div>
            </div>
            <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-semibold tracking-wide uppercase animate-pulse shrink-0">
              Retrying
            </span>
          </div>
        )}

        {isScanning && (
          <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/10 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="relative w-9 h-9 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-pulse" />
                <Wifi className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Searching for nearby devices...
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Searching for your active, discoverable laptops and mobile devices on this subnet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Hub Search Bar */}
        <div className="flex items-center justify-between gap-4 p-3 bg-zinc-950/20 rounded-xl border border-white/5">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Find paired device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-950/50 border border-white/8 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="text-[11px] text-zinc-500 font-sans flex items-center gap-2">
            <span>Online Links: {devices.filter(d => d.status === 'online').length}</span>
            <span>•</span>
            <span>Total: {devices.length}</span>
          </div>
        </div>

        {/* MAIN MULTI-GROUP GRID */}
        <div className="space-y-8">
          
          {/* SECTION A: TRUSTED ACTIVE DEVICES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Trusted Storage Nodes ({trustedPairedDevices.length})
            </h3>
            
            {trustedPairedDevices.length === 0 ? (
              <div className="p-6 border border-dashed border-white/5 rounded-2xl bg-zinc-950/10 text-center text-xs text-zinc-500">
                No active trusted paired devices found on this subnet.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {trustedPairedDevices.map((device) => {
                  const CategoryIcon = getDeviceIcon(device.category, device.type);
                  const storageUsedPercent = getStoragePercentage(device.storageFree, device.storageTotal);

                  return (
                    <div
                      key={device.id}
                      onClick={() => onBrowseDeviceFiles(device.name)}
                      onDragOver={(e) => handleDragOver(e, device.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, device)}
                      className={`rounded-2xl bg-zinc-950/40 shadow-xl overflow-hidden shadow-black/20 p-5 space-y-4 hover:bg-zinc-950/60 transition-all duration-200 relative group flex flex-col justify-between cursor-pointer border-2 ${
                        dragOverDeviceId === device.id
                          ? 'border-blue-500 bg-blue-500/10 scale-[1.02] ring-4 ring-blue-500/20'
                          : 'border-blue-500/25 hover:border-blue-500/40'
                      }`}
                      title={`Click card to browse files on ${device.name}`}
                    >
                      {/* Windows 11 Fluent Active Trusted Banner Accent */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 to-blue-600/50" />

                      {/* Top Row: Info Title/Category */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${device.avatarColor}`}>
                            <CategoryIcon className="w-5.5 h-5.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">
                                {device.nickname || device.name}
                              </h3>
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Secured Peer
                              </span>
                              {device.isTrusted && (
                                <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  Trusted
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-500 block mt-0.5">
                              {getCategoryLabel(device.category, device.type)} {device.nickname ? `(${device.name})` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Connection statistics & Battery block */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {getConnectionQualityBadge(device.connectionQuality)}
                          {getBatteryBadge(device.batteryPercentage)}
                        </div>
                      </div>



                      {/* Storage Progress bar details (Prioritizes files/folders content) */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                            <HardDrive className="w-3.5 h-3.5 text-[#52525b]" />
                            Storage Space
                          </span>
                          <span className="text-zinc-300 font-medium">{device.storageFree} free of {device.storageTotal}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300" 
                            style={{ width: `${storageUsedPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* INTERACTIVE ACTIONS BOX */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2.5 relative">
                        {/* Hidden standard multiple file input */}
                        <input
                          id={`file-picker-${device.id}`}
                          type="file"
                          multiple
                          className="hidden"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleFileSelectionChange(e, device)}
                        />

                        <div className="flex-1 flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onBrowseDeviceFiles(device.name); }}
                            className="flex-1 py-1.5 text-center bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 hover:text-white font-semibold rounded-lg text-xs border border-white/5 transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            Browse Storage
                          </button>
                          
                          {/* PROMINENT "SEND FILES" INTERACTIVE OPTION */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const fileInput = document.getElementById(`file-picker-${device.id}`) as HTMLInputElement;
                              if (fileInput) {
                                fileInput.value = ''; // clears cache
                                fileInput.click();
                              }
                            }}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send Files
                          </button>
                        </div>

                        {/* Info details toggle */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedInfoDevice(device); }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer border border-transparent hover:border-white/5"
                          title="View system hardware specifications details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Beautiful drag over feedback overlay */}
                      {dragOverDeviceId === device.id && (
                        <div className="absolute inset-0 bg-blue-950/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 space-y-2 animate-fade-in text-center rounded-2xl border-2 border-blue-400">
                          <Send className="w-10 h-10 text-blue-400 animate-bounce" />
                          <p className="text-sm font-bold text-white">Drop files to transfer</p>
                          <p className="text-xs text-zinc-400 max-w-xs leading-normal">
                            Release items here to immediately prepare for sending to <strong className="text-blue-300">{device.name}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: DISCOVERY / UNPAIRED DEVICES NEARBY */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              Broadcasting on Wi-Fi - Pending Trust Authentication ({availableDiscoverDevices.length})
            </h3>

            {availableDiscoverDevices.length === 0 ? (
              <div className="p-6 border border-dashed border-white/5 rounded-2xl bg-zinc-950/10 text-center text-xs text-zinc-500">
                No nearby unpaired broadcasters detected. Use &apos;Pair New Device&apos; above.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {availableDiscoverDevices.map((device) => {
                  const CategoryIcon = getDeviceIcon(device.category, device.type);
                  return (
                    <div
                      key={device.id}
                      onClick={() => {
                        setSelectedDetectedDevice({ name: device.name, ip: device.ipAddress, category: device.category });
                        setVerificationCode('3914');
                        setPairingStep(2);
                        setShowPairingModal(true);
                      }}
                      className="p-5 rounded-2xl bg-zinc-950/20 border border-dashed border-amber-500/20 hover:border-amber-500/40 hover:bg-zinc-950/40 cursor-pointer transition duration-150 overflow-hidden relative group flex flex-col justify-between shadow-md"
                      title={`Click card to pair ${device.name}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl border shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/20`}>
                            <CategoryIcon className="w-5.5 h-5.5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-zinc-200">{device.name}</h3>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              {getCategoryLabel(device.category, device.type)}
                            </span>
                          </div>
                        </div>

                        {getBatteryBadge(device.batteryPercentage)}
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between gap-4">
                        <span className="text-[10px] text-zinc-500 font-medium">Link connection uses zero-config pairing</span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedInfoDevice(device); }}
                            className="px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 text-zinc-400 hover:text-white transition text-xs font-semibold cursor-pointer"
                          >
                            Stats info
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetectedDevice({ name: device.name, ip: device.ipAddress, category: device.category });
                              setVerificationCode('3914');
                              setPairingStep(2);
                              setShowPairingModal(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-amber-500/10 transition active:scale-98 cursor-pointer flex items-center gap-1"
                          >
                            Pair Node
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION C: OFFLINE REMEMBERED DAEMONS */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
              Offline / Remembered Nodes ({offlineDevices.length})
            </h3>

            {offlineDevices.length === 0 ? null : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {offlineDevices.map((device) => {
                  const CategoryIcon = getDeviceIcon(device.category, device.type);
                  return (
                    <div
                      key={device.id}
                      className="p-4 rounded-xl bg-zinc-950/15 border border-white/5 flex flex-col justify-between gap-3 relative overflow-hidden group shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 truncate">
                          <div className={`p-2.5 border border-white/5 rounded-lg bg-zinc-900/60 ${device.avatarColor || 'text-zinc-500'} shrink-0`}>
                            <CategoryIcon className="w-4.5 h-4.5" />
                          </div>
                          <div className="truncate text-left">
                            <h4 className="font-bold text-xs text-zinc-200 truncate flex items-center gap-1.5 title-wrapper">
                              {device.nickname || device.name}
                              {device.isTrusted && (
                                <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1 rounded font-bold uppercase tracking-wider shrink-0" title="Trusted peer node">
                                  Trusted
                                </span>
                              )}
                            </h4>
                            {device.nickname && (
                              <span className="text-[9px] text-zinc-500 block truncate font-mono">({device.name})</span>
                            )}
                            <span className="text-[10px] text-zinc-500 block font-sans mt-0.5" title="Last seen timestamp">
                              Last Seen: {device.lastActive || device.lastSeen || 'Determining...'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveDevice(device.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition cursor-pointer border border-transparent hover:border-white/5 shrink-0"
                          title="Forget device pairing and keys"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Diagnostic specifications bar */}
                      <div className="pt-2 border-t border-white/4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          Quality: <strong className="text-zinc-400">{device.connectionQuality || 'Excelente'}</strong>
                        </span>
                        {settings?.autoReconnectDevices && (
                          <span className="text-blue-400 font-semibold flex items-center gap-1 animate-pulse">
                            <span className="w-1 h-1 rounded-full bg-blue-400" />
                            Auto-Reconnect: Listening
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* RIGHT EXPANDABLE DETAILED SPEC INSPECTOR PANE (SLIDES OUT ON DEMO SIDEBAR LINK) */}
      {selectedInfoDevice && (
        <div className="w-[300px] border-l border-white/5 bg-zinc-950/50 p-5 flex flex-col justify-between text-xs animate-fade-in shrink-0">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                <Network className="w-3.5 h-3.5 text-blue-400" />
                Device Specification
              </span>
              <button 
                onClick={() => setSelectedInfoDevice(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title device profile avatar */}
            <div className="text-center p-4 bg-zinc-900/60 rounded-xl border border-white/5 relative overflow-hidden">
              <div className={`p-4 rounded-full mx-auto w-14 h-14 flex items-center justify-center border font-bold ${selectedInfoDevice.avatarColor}`}>
                {React.createElement(getDeviceIcon(selectedInfoDevice.category, selectedInfoDevice.type), { className: 'w-6 h-6' })}
              </div>
              <h4 className="font-bold text-white text-sm mt-3">{selectedInfoDevice.name}</h4>
              <span className="text-[10px] px-2 py-0.5 mt-1 text-center inline-block bg-zinc-800 text-zinc-400 border border-white/5 rounded-full capitalize">
                {getCategoryLabel(selectedInfoDevice.category, selectedInfoDevice.type)}
              </span>
            </div>

            {/* Info Diagnostics properties metadata lists */}
            <div className="space-y-3.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Network Diagnostics</span>
              
              <div className="space-y-2.5 text-zinc-400 bg-zinc-950/40 p-3 rounded-lg border border-white/5 font-sans">
                <div className="flex justify-between border-b border-white/4 pb-1.5">
                  <span>Host IP:</span>
                  <span className="font-mono text-zinc-200">{selectedInfoDevice.ipAddress}</span>
                </div>
                <div className="flex justify-between border-b border-white/4 pb-1.5">
                  <span>P2P Port:</span>
                  <span className="font-mono text-zinc-200">5353 (mDNS)</span>
                </div>
                <div className="flex justify-between border-b border-white/4 pb-1.5">
                  <span>MAC Address:</span>
                  <span className="font-mono text-zinc-200">E4:F2:A3:4C:D8:12</span>
                </div>
                <div className="flex justify-between border-b border-white/4 pb-1.5">
                  <span>Link Speed:</span>
                  <span className="text-blue-400 font-mono font-semibold">1200 Mbps (5GHz)</span>
                </div>
                <div className="flex justify-between border-b border-white/4 pb-1.5">
                  <span>TLS Cipher:</span>
                  <span className="font-mono text-zinc-300 text-[10px]" title="Authenticated Direct Streams Encrypted keys">CHACHA20_POLY1305</span>
                </div>
                <div className="flex justify-between">
                  <span>OS Architecture:</span>
                  <span className="text-zinc-300 font-semibold">{selectedInfoDevice.type === 'windows' ? 'Windows 11 Build 22631' : 'Android 14 API 34'}</span>
                </div>
              </div>
            </div>

            {/* Trust and status settings */}
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Security Details</span>
              <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <span>Paired Trust level:</span>
                  {selectedInfoDevice.isTrusted ? (
                    <span className="text-blue-400 font-bold">Trusted Peer</span>
                  ) : (
                    <span className="text-amber-500 font-medium">Authentication Pending</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  {selectedInfoDevice.isTrusted 
                    ? 'This physical token has authorized mutual read & write folder storage actions on this device.'
                    : 'Requires numeric challenge confirmation matching before accessing shared folders.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action on details footer */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            {selectedInfoDevice.isTrusted && selectedInfoDevice.status !== 'offline' && (
              <button
                onClick={() => onBrowseDeviceFiles(selectedInfoDevice.name)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Browse Device Storage
              </button>
            )}

            {selectedInfoDevice.isTrusted ? (
              <button
                onClick={() => {
                  onRevokeDeviceTrust(selectedInfoDevice.id);
                  setSelectedInfoDevice(null);
                  triggerToast(`Revoked pairing trust permissions for: ${selectedInfoDevice.name}`);
                }}
                className="w-full py-1.5 border border-amber-500/10 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Revoke Pairing Link
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* PAIRING CHALLENGE WIZARD WIN11 SCREEN (AUTHENTIC COMPACT MODAL) */}
      {showPairingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden text-zinc-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-950">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Shield className="w-4 h-4 text-amber-400" />
                Zero-Config Mobile Match
              </h3>
              <button
                onClick={() => setShowPairingModal(false)}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wizard Steps */}
            <div className="p-5">
              {pairingStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <div className="inline-block p-3 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
                      <Radio className="w-8 h-8 text-amber-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-3">Probing subnet broadcasts...</h4>
                    <p className="text-[11px] text-zinc-400 max-w-xs mx-auto mt-1">
                      Choose an unauthenticated device detected broadcasting the mDNS handshakes:
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 rounded-xl p-3 border border-white/5 divide-y divide-white/5 space-y-1">
                    {detectedDevices.map((d, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDetectedDevice(d);
                          setPairingStep(2);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-xs text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-amber-400" />
                          <span className="font-semibold text-zinc-200">{d.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {d.ip} <ArrowRight className="inline w-3 h-3 text-blue-400 ml-1.5" />
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] text-zinc-500 flex items-start gap-1.5 pt-2">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                    <span>No online PIN logs or remote services. Mutual client negotiation runs purely inside local Wi-Fi.</span>
                  </div>
                </div>
              )}

              {pairingStep === 2 && selectedDetectedDevice && (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">Trust Pin Challenge</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                      Verify that the cryptographic matching challenge matches the code displayed on <strong className="text-zinc-200">{selectedDetectedDevice.name}</strong>:
                    </p>
                  </div>

                  {/* PIN Display */}
                  <div className="flex justify-center gap-3.5 py-2">
                    {verificationCode.split('').map((char, index) => (
                      <span
                        key={index}
                        className="w-11 h-14 rounded-lg bg-zinc-950 border border-white/10 font-mono font-bold text-2xl text-blue-400 flex items-center justify-center shadow-inner"
                      >
                        {char}
                      </span>
                    ))}
                  </div>

                  {/* Security Verification Actions */}
                  <div className="flex gap-2.5 pt-4">
                    <button
                      onClick={() => setPairingStep(1)}
                      className="flex-1 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-zinc-300 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCompletePairing}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white shadow-md cursor-pointer"
                    >
                      Verify Match
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEND FILES CONFIRMATION DIALOG (WINDOWS QUICK SHARE STYLE) */}
      {pendingTransferDevice && pendingTransferFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden text-zinc-200 animate-scale-up">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-950">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <Send className="w-4 h-4 text-blue-400" />
                Quick Share Preparation
              </h3>
              <button
                onClick={() => {
                  setPendingTransferFiles([]);
                  setPendingTransferDevice(null);
                }}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${pendingTransferDevice.avatarColor}`}>
                  {React.createElement(getDeviceIcon(pendingTransferDevice.category, pendingTransferDevice.type), { className: 'w-5 h-5' })}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Send to {pendingTransferDevice.name}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Ready to initiate encrypted local Wi-Fi transfer streams.
                  </p>
                </div>
              </div>

              {/* Scrollable List of Files */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto bg-zinc-950/80 p-3 rounded-xl border border-white/5">
                {pendingTransferFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0 text-xs text-left">
                    <div className="flex items-center gap-2 truncate pr-4">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate text-zinc-300" title={file.name}>{file.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 shrink-0">{file.size}</span>
                  </div>
                ))}
              </div>

              {/* Summary Dashboard Details block */}
              <div className="bg-blue-500/5 rounded-xl border border-blue-500/15 p-3 flex justify-between items-center text-xs text-left">
                <div className="space-y-0.5">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Payload Summary</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-200 font-bold">{pendingTransferFiles.length} file{pendingTransferFiles.length > 1 ? 's' : ''}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-blue-400 font-bold">{getPendingTotalSize()}</span>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none">
                  Ready to Transfer
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setPendingTransferFiles([]);
                    setPendingTransferDevice(null);
                  }}
                  className="flex-grow py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmTransfer}
                  className="flex-grow py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/15 transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Start Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

