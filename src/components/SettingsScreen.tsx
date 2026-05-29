import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, FolderOpen, Shield, KeyRound, HardDrive, Wifi, 
  RefreshCw, Power, Zap, Info, RotateCcw, AlertTriangle, Cpu, Terminal,
  Trash2, Edit3, Check, X, Smartphone, Laptop, Tablet, Monitor,
  ArrowLeft, ArrowRight, ArrowUp, Search, FolderPlus, Folder, AlertOctagon
} from 'lucide-react';
import { AppSettings, Device } from '../types';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (updated: AppSettings) => void;
  onRestoreDefaults: () => void;
  devices: Device[];
  onForgetDevice: (deviceId: string) => void;
  onForgetAllDevices: () => void;
  onUpdateDeviceNickname: (deviceId: string, nickname: string) => void;
}

export default function SettingsScreen({
  settings,
  onUpdateSettings,
  onRestoreDefaults,
  devices,
  onForgetDevice,
  onForgetAllDevices,
  onUpdateDeviceNickname,
}: SettingsScreenProps) {
  const [showDevTools, setShowDevTools] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [tempNickname, setTempNickname] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Default Downloads Path permanence states
  const lastValidPathRef = useRef(settings.defaultDownloadPath || 'C:\\Users\\Pavan\\Downloads\\FileBridge');
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [pickerPath, setPickerPath] = useState(settings.defaultDownloadPath || 'C:\\Users\\Pavan\\Downloads\\FileBridge');
  const [pickerSelectedInView, setPickerSelectedInView] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerHistory, setPickerHistory] = useState<string[]>([settings.defaultDownloadPath || 'C:\\Users\\Pavan\\Downloads\\FileBridge']);
  const [pickerHistoryIdx, setPickerHistoryIdx] = useState(0);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  // Initialize simulated Windows 11 directory structures
  const [fs, setFs] = useState<Record<string, { parent: string; children: string[]; restriction?: 'offline' | 'permission' | null }>>({
    'This PC': {
      parent: '',
      children: ['C:\\', 'D:\\', 'E:\\', 'F:\\'],
    },
    'C:\\': {
      parent: 'This PC',
      children: ['C:\\Windows', 'C:\\Program Files', 'C:\\Users'],
    },
    'C:\\Windows': {
      parent: 'C:\\',
      children: ['C:\\Windows\\System32', 'C:\\Windows\\Web', 'C:\\Windows\\Logs'],
      restriction: 'permission'
    },
    'C:\\Windows\\System32': {
      parent: 'C:\\Windows',
      children: [],
      restriction: 'permission'
    },
    'C:\\Windows\\Web': {
      parent: 'C:\\Windows',
      children: [],
      restriction: 'permission'
    },
    'C:\\Windows\\Logs': {
      parent: 'C:\\Windows',
      children: [],
      restriction: 'permission'
    },
    'C:\\Program Files': {
      parent: 'C:\\',
      children: ['C:\\Program Files\\Common Files', 'C:\\Program Files\\Git'],
      restriction: 'permission'
    },
    'C:\\Program Files\\Common Files': {
      parent: 'C:\\Program Files',
      children: [],
      restriction: 'permission'
    },
    'C:\\Program Files\\Git': {
      parent: 'C:\\Program Files',
      children: [],
      restriction: 'permission'
    },
    'C:\\Users': {
      parent: 'C:\\',
      children: ['C:\\Users\\Pavan', 'C:\\Users\\Public'],
    },
    'C:\\Users\\Public': {
      parent: 'C:\\Users',
      children: ['C:\\Users\\Public\\Documents', 'C:\\Users\\Public\\Downloads'],
    },
    'C:\\Users\\Public\\Documents': {
      parent: 'C:\\Users\\Public',
      children: [],
    },
    'C:\\Users\\Public\\Downloads': {
      parent: 'C:\\Users\\Public',
      children: [],
    },
    'C:\\Users\\Pavan': {
      parent: 'C:\\Users',
      children: ['C:\\Users\\Pavan\\Desktop', 'C:\\Users\\Pavan\\Downloads', 'C:\\Users\\Pavan\\Documents'],
    },
    'C:\\Users\\Pavan\\Desktop': {
      parent: 'C:\\Users\\Pavan',
      children: [],
    },
    'C:\\Users\\Pavan\\Documents': {
      parent: 'C:\\Users\\Pavan',
      children: [],
    },
    'C:\\Users\\Pavan\\Downloads': {
      parent: 'C:\\Users\\Pavan',
      children: ['C:\\Users\\Pavan\\Downloads\\FileBridge'],
    },
    'C:\\Users\\Pavan\\Downloads\\FileBridge': {
      parent: 'C:\\Users\\Pavan\\Downloads',
      children: [],
    },
    'D:\\': {
      parent: 'This PC',
      children: ['D:\\Transfers', 'D:\\Backups', 'D:\\RestrictedBackup'],
    },
    'D:\\Transfers': {
      parent: 'D:\\',
      children: [],
    },
    'D:\\Backups': {
      parent: 'D:\\',
      children: [],
    },
    'D:\\RestrictedBackup': {
      parent: 'D:\\',
      children: [],
      restriction: 'permission'
    },
    'E:\\': {
      parent: 'This PC',
      children: ['E:\\Phone Files', 'E:\\Media'],
    },
    'E:\\Phone Files': {
      parent: 'E:\\',
      children: [],
    },
    'E:\\Media': {
      parent: 'E:\\',
      children: [],
    },
    'F:\\': {
      parent: 'This PC',
      children: ['F:\\Photos', 'F:\\BackupDisk'],
      restriction: 'offline'
    },
    'F:\\Photos': {
      parent: 'F:\\',
      children: [],
      restriction: 'offline'
    },
    'F:\\BackupDisk': {
      parent: 'F:\\',
      children: [],
      restriction: 'offline'
    }
  });

  // Track the current path when opening picker and reset state
  useEffect(() => {
    if (isFolderPickerOpen) {
      const initialPath = settings.defaultDownloadPath || 'C:\\Users\\Pavan\\Downloads\\FileBridge';
      setPickerPath(initialPath);
      setPickerHistory([initialPath]);
      setPickerHistoryIdx(0);
      setPickerSelectedInView(null);
      setPickerSearch('');
      setPickerError(null);
      setShowNewFolderInput(false);
    }
  }, [isFolderPickerOpen, settings.defaultDownloadPath]);

  // Sync back history and active routes
  const navigateTo = (path: string) => {
    if (path === pickerPath) return;

    // Check offline drive access when trying to navigate
    if (path.toUpperCase().startsWith('F:') || path.toUpperCase().startsWith('F:\\')) {
      setPickerError("Drive F: is currently offline or unavailable. Reverting to last valid path.");
      // Auto revert settings / folder path to last valid path
      setTimeout(() => {
        setPickerPath(lastValidPathRef.current);
        setPickerError(`Reverted to last valid path: ${lastValidPathRef.current}`);
      }, 3500);
      return;
    }

    const newHistory = pickerHistory.slice(0, pickerHistoryIdx + 1);
    newHistory.push(path);
    setPickerHistory(newHistory);
    setPickerHistoryIdx(newHistory.length - 1);
    
    setPickerPath(path);
    setPickerSelectedInView(null);
    setPickerSearch('');
    setPickerError(null);
    setShowNewFolderInput(false);
  };

  const handleBack = () => {
    if (pickerHistoryIdx > 0) {
      const parentIdx = pickerHistoryIdx - 1;
      setPickerHistoryIdx(parentIdx);
      setPickerPath(pickerHistory[parentIdx]);
      setPickerSelectedInView(null);
      setPickerSearch('');
      setPickerError(null);
      setShowNewFolderInput(false);
    }
  };

  const handleForward = () => {
    if (pickerHistoryIdx < pickerHistory.length - 1) {
      const nextIdx = pickerHistoryIdx + 1;
      setPickerHistoryIdx(nextIdx);
      setPickerPath(pickerHistory[nextIdx]);
      setPickerSelectedInView(null);
      setPickerSearch('');
      setPickerError(null);
      setShowNewFolderInput(false);
    }
  };

  const handleUpLevel = () => {
    const parentNode = fs[pickerPath]?.parent;
    if (parentNode) {
      navigateTo(parentNode);
    }
  };

  // Inline simulation folder creator inside the current file list view
  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) {
      setNewFolderName('');
      setShowNewFolderInput(false);
      return;
    }

    if (/[\\/:*?"<>|]/.test(name)) {
      setPickerError('Folder name contains illegal characters (\\ / : * ? " < > |)');
      return;
    }

    const pathSuffix = pickerPath.endsWith('\\') ? '' : '\\';
    const newPath = `${pickerPath}${pathSuffix}${name}`;

    if (fs[newPath]) {
      setPickerError('A folder with that name already exists in this directory.');
      return;
    }

    // Insert directory in filesystem tree state
    const currentChildren = fs[pickerPath]?.children || [];
    setFs({
      ...fs,
      [pickerPath]: {
        ...fs[pickerPath],
        children: [...currentChildren, newPath],
      },
      [newPath]: {
        parent: pickerPath,
        children: [],
      }
    });

    setNewFolderName('');
    setShowNewFolderInput(false);
    setPickerSelectedInView(newPath);
    setPickerError(null);
    triggerToast(`Created folder "${name}" in simulated directory tree.`);
  };

  // Folder validation permissions checker & saver
  const handleConfirmPath = (targetPath: string) => {
    let sanitized = targetPath.trim();
    if (!sanitized) {
      setPickerError("Path is empty or invalid Windows format.");
      return;
    }

    // Windows normalize
    sanitized = sanitized.replace(/\//g, '\\');
    if (sanitized.length > 3 && sanitized.endsWith('\\')) {
      sanitized = sanitized.slice(0, -1);
    }

    const upper = sanitized.toUpperCase();

    // Check Drive F: restriction
    if (upper.startsWith('F:') || upper.startsWith('F:\\')) {
      setPickerError("Drive F: is currently offline or unavailable. Reverting to last valid path.");
      // Revert to last valid path
      setTimeout(() => {
        onUpdateSettings({
          ...settings,
          defaultDownloadPath: lastValidPathRef.current
        });
        setPickerPath(lastValidPathRef.current);
        setPickerError(null);
      }, 3500);
      return;
    }

    // Check restricted directories (C:\Windows, C:\Program Files, D:\RestrictedBackup)
    const accessBlocked = 
      upper.startsWith('C:\\WINDOWS') || 
      upper.startsWith('C:\\PROGRAM FILES') ||
      upper.startsWith('D:\\RESTRICTEDBACKUP');

    if (accessBlocked) {
      setPickerError(`Access Denied: Insufficient write/read permissions for "${sanitized}". Reverting to last valid folder.`);
      // Revert path
      setTimeout(() => {
        onUpdateSettings({
          ...settings,
          defaultDownloadPath: lastValidPathRef.current
        });
        setPickerPath(lastValidPathRef.current);
        setPickerError(null);
      }, 3500);
      return;
    }

    // Windows drive format validation
    const driveFormat = /^[a-zA-Z]:\\/;
    if (!driveFormat.test(sanitized) && sanitized !== 'This PC') {
      setPickerError("Invalid Windows path structure. Paths must start with an active drive letter (e.g., C:\\).");
      return;
    }

    let finalPath = sanitized;
    let autoCreatedFileBridgeSub = false;

    // RULE: Automatically create FileBridge folder if it does not exist
    // If the path does not end with 'FileBridge', let's check if the FileBridge subdirectory exists or automatic create it
    if (!upper.endsWith('\\FILEBRIDGE') && !upper.endsWith('FILEBRIDGE')) {
      const suffix = finalPath.endsWith('\\') ? '' : '\\';
      const fileBridgePath = `${finalPath}${suffix}FileBridge`;

      // Check if this subfolder exists in the simulated filesystem tree; if not, create it!
      if (!fs[fileBridgePath]) {
        const currentChildren = fs[finalPath]?.children || [];
        setFs(prev => ({
          ...prev,
          [finalPath]: {
            ...prev[finalPath],
            children: currentChildren.includes(fileBridgePath) ? currentChildren : [...currentChildren, fileBridgePath]
          },
          [fileBridgePath]: {
            parent: finalPath,
            children: []
          }
        }));
        autoCreatedFileBridgeSub = true;
      }
      finalPath = fileBridgePath;
    } else {
      // It ends with FileBridge, check if the folder itself exists in fs, if not create it
      if (!fs[finalPath]) {
        // Parse parent
        const parts = finalPath.split('\\');
        const leaf = parts.pop() || 'FileBridge';
        const parentOfBridge = parts.join('\\');
        
        if (parentOfBridge && fs[parentOfBridge]) {
          const currentChildren = fs[parentOfBridge].children || [];
          setFs(prev => ({
            ...prev,
            [parentOfBridge]: {
              ...prev[parentOfBridge],
              children: currentChildren.includes(finalPath) ? currentChildren : [...currentChildren, finalPath]
            },
            [finalPath]: {
              parent: parentOfBridge,
              children: []
            }
          }));
          autoCreatedFileBridgeSub = true;
        } else {
          // Put root node
          setFs(prev => ({
            ...prev,
            [finalPath]: {
              parent: 'This PC',
              children: []
            }
          }));
          autoCreatedFileBridgeSub = true;
        }
      }
    }

    // Save selected path permanently to localstorage in setting item list
    lastValidPathRef.current = finalPath;
    onUpdateSettings({
      ...settings,
      defaultDownloadPath: finalPath
    });

    setIsFolderPickerOpen(false);

    if (autoCreatedFileBridgeSub) {
      triggerToast(`Validated permissions. Automatically created missing "FileBridge" folder at: ${finalPath}`);
    } else {
      triggerToast(`Permission verified. Default sharing path updated to: ${finalPath}`);
    }
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggle = (key: keyof AppSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key]
    };
    onUpdateSettings(updated);
  };

  const handlePortChange = (val: string) => {
    const numericPort = parseInt(val.replace(/\D/g, '')) || 5353;
    onUpdateSettings({
      ...settings,
      port: Math.min(65535, Math.max(1024, numericPort))
    });
  };

  const trustedDevices = devices.filter(d => d.isTrusted);

  const getDeviceIcon = (category: string | undefined, type: 'android' | 'windows') => {
    if (category) {
      if (category === 'phone') return Smartphone;
      if (category === 'tablet') return Tablet;
      if (category === 'laptop') return Laptop;
      if (category === 'desktop') return Monitor;
    }
    return type === 'windows' ? Laptop : Smartphone;
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-zinc-900/40 text-zinc-100 font-sans relative">
      
      {/* Toast alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 border border-emerald-500/30 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in text-xs text-zinc-200">
          <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Title */}
      <div className="pb-6 border-b border-white/5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          FileBridge Configurations
          <span className="text-[10px] bg-zinc-850 text-zinc-400 px-2.5 py-0.5 rounded border border-white/8 font-mono">
            Daemon v1.0
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Adjust background mDNS discovery rules, folder default sharing paths, and network socket port definitions.
        </p>
      </div>

      {/* Settings Sections Grid layout */}
      <div className="my-6 space-y-6 max-w-3xl">
        
        {/* SECTION 1: GENERAL SYSTEM */}
        <div className="bg-zinc-950/35 border border-white/5 rounded-xl overflow-hidden p-5 space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Power className="w-4 h-4" />
            General System Settings
          </h3>
          <p className="text-[11px] text-zinc-500">Enable deep background hardware integration for continuous LAN availability.</p>

          <div className="space-y-3.5 pt-2">
            {/* Auto Start */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Start with Windows Startup</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Launches the FileBridge socket daemon minimized to the system tray upon boot.</p>
              </div>
              <button
                onClick={() => handleToggle('autoStart')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.autoStart ? 'bg-blue-600' : 'bg-zinc-800 border border-white/10'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.autoStart ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Separator */}
            <div className="h-[1px] bg-white/5" />

            {/* Prevent sleep during streams */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Keep Windows Awake During Transfers</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Blocks Windows from sleeping or suspending threads while actively piping file chunks over Wi-Fi.</p>
              </div>
              <button
                onClick={() => handleToggle('preventSleepDuringTransfer')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.preventSleepDuringTransfer ? 'bg-blue-600' : 'bg-zinc-800 border border-white/10'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.preventSleepDuringTransfer ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: ACCESS & PATH DIRECTORIES */}
        <div className="bg-zinc-950/35 border border-white/5 rounded-xl overflow-hidden p-5 space-y-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Storage &amp; Permissions
          </h3>
          <p className="text-[11px] text-zinc-500">Configure directory read-write boundaries and automated device pairing rules.</p>

          <div className="space-y-4 pt-2">
            {/* Auto Trust paired items */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Auto-Trust Paired Devices</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">By default, paired devices require zero prompts to access shared files when on the same subnet.</p>
              </div>
              <button
                onClick={() => handleToggle('autoTrustDevices')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.autoTrustDevices ? 'bg-blue-600' : 'bg-zinc-800 border border-white/10'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.autoTrustDevices ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Separator */}
            <div className="h-[1px] bg-white/5" />

            {/* Auto Reconnect trusted devices setting */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Auto-Reconnect Trusted Devices</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Trusted nodes automatically pair and start discovery when they appear on the same Wi-Fi subnet.</p>
              </div>
              <button
                onClick={() => handleToggle('autoReconnectDevices')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.autoReconnectDevices ? 'bg-blue-600' : 'bg-zinc-800 border border-white/10'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.autoReconnectDevices ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Separator */}
            <div className="h-[1px] bg-white/5" />

            {/* Default receipt folder indicator */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-200 block">Default Downloads Path</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.defaultDownloadPath}
                  onChange={(e) => {
                    onUpdateSettings({
                      ...settings,
                      defaultDownloadPath: e.target.value
                    });
                  }}
                  onBlur={(e) => {
                    handleConfirmPath(e.target.value);
                  }}
                  className="bg-zinc-950 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-zinc-350 flex-1 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. C:\Users\Pavan\Downloads\FileBridge"
                />
                <button
                  onClick={() => setIsFolderPickerOpen(true)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-zinc-100 text-xs font-semibold border border-white/10 hover:border-white/20 cursor-pointer flex items-center gap-1.5 transition-all shadow-md active:translate-y-[1px]"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Browse Path
                </button>
              </div>
              <span className="block text-[10px] text-zinc-500">All incoming folders and zipped transfers from paired phones will compile inside this destination directory.</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: TRUSTED DEVICES MANAGEMENT PANEL */}
        <div className="bg-zinc-950/35 border border-white/5 rounded-xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-violet-400" />
                Manage Trusted Devices ({trustedDevices.length})
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Edit nicknames, view pairing status, and revoke permission links here.</p>
            </div>
            {trustedDevices.length > 0 && (
              <button
                onClick={() => {
                  onForgetAllDevices();
                  triggerToast('Forgot all trusted peer devices');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 font-semibold text-xs transition duration-150 cursor-pointer"
              >
                Forget All Trusted
              </button>
            )}
          </div>

          {trustedDevices.length === 0 ? (
            <div className="p-5 text-center border border-dashed border-white/5 rounded-xl text-zinc-500 text-xs leading-normal">
              No authenticated trusted devices registered. Connect devices from the <span className="text-blue-400 font-semibold px-0.5">Devices</span> screen.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {trustedDevices.map((device) => {
                const ItemIcon = getDeviceIcon(device.category, device.type);
                const isEditing = editingDeviceId === device.id;

                return (
                  <div
                    key={device.id}
                    className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-lg border ${device.avatarColor || 'bg-zinc-800 text-zinc-300'} shrink-0`}>
                        <ItemIcon className="w-4.5 h-4.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tempNickname}
                              onChange={(e) => setTempNickname(e.target.value)}
                              className="bg-zinc-900 border border-white/10 rounded px-2 py-0.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-sans max-w-[160px]"
                              placeholder="New Nickname"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                onUpdateDeviceNickname(device.id, tempNickname);
                                setEditingDeviceId(null);
                                triggerToast(`Updated device nickname to: ${tempNickname || device.name}`);
                              }}
                              className="p-1 rounded hover:bg-emerald-500/15 text-emerald-400 border border-transparent hover:border-emerald-500/20 cursor-pointer"
                              title="Save nickname"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingDeviceId(null)}
                              className="p-1 rounded hover:bg-white/5 text-zinc-400 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-white truncate" title={device.nickname || device.name}>
                              {device.nickname || device.name}
                            </h4>
                            {device.nickname && (
                              <span className="text-[9px] text-zinc-500 font-mono truncate max-w-[100px]" title={`(${device.name})`}>
                                ({device.name})
                              </span>
                            )}
                            <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider scale-90">
                              Trusted
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3.5 mt-1 text-[10px] text-zinc-500 flex-wrap">
                          <span>IP: <strong className="font-mono text-zinc-400">{device.ipAddress}</strong></span>
                          <span>•</span>
                          <span>Last Seen: <strong className="text-zinc-400">{device.lastActive || device.lastSeen || 'Unknown'}</strong></span>
                          <span>•</span>
                          <span>Quality: <strong className="text-zinc-400">{device.connectionQuality || 'Excellent'}</strong></span>
                        </div>

                        {settings.autoReconnectDevices && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-blue-400/90 font-semibold font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Auto-Reconnect Enabled
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingDeviceId(device.id);
                            setTempNickname(device.nickname || device.name);
                          }}
                          className="p-1.5 rounded hover:bg-white/5 border border-transparent hover:border-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
                          title="Rename device nickname"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          onForgetDevice(device.id);
                          triggerToast(`Revoked association link for: ${device.nickname || device.name}`);
                        }}
                        className="p-1.5 rounded hover:bg-red-500/15 border border-transparent hover:border-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                        title="Forget Device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DEVELOPER TOOLS TOGGLE CARD */}
        <div className="bg-zinc-950/35 border border-zinc-800/60 rounded-xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-left">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Developer Tools &amp; Diagnostics
              </h3>
              <p className="text-[11px] text-zinc-400">
                Access advanced socket port overrides, mDNS telemetry logging, and background process status checks. Off by default.
              </p>
            </div>
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                showDevTools ? 'bg-amber-500 font-bold' : 'bg-zinc-800 border border-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${showDevTools ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {showDevTools && (
            <div className="pt-4 border-t border-white/5 space-y-5 animate-fade-in text-left">
              {/* SECTION 4: PROTOCOLS AND SOCKET PORTS */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Zero-Config Multicast Port</h4>
                    <p className="text-[11px] text-zinc-550 mt-0.5">mDNS broadcasting socket. Ensure this port is not blocked by Windows Defender FirewallRules.</p>
                  </div>
                  <input
                    type="text"
                    value={settings.port}
                    onChange={(e) => handlePortChange(e.target.value)}
                    className="w-24 bg-zinc-950 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-center text-amber-400 font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Diagnostics warning */}
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start gap-2.5 text-[11px] text-zinc-450 font-sans">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    By default, port <strong>5353</strong> is assigned for IETF standardized mDNS. Changing this value may prevent legacy Android Bonjour clients from discovering your PC without custom discovery configuration.
                  </span>
                </div>
              </div>

              {/* Developer Telemetry & Logging Terminal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 text-zinc-400">
                    <Terminal className="w-3.5 h-3.5 text-amber-500" />
                    mDNS Multicast Log Console
                  </span>
                  <span className="text-[9px] bg-zinc-900 border border-white/5 px-2 py-0.5 rounded font-mono text-[10px] text-emerald-400 animate-pulse font-bold">
                    Socket Live
                  </span>
                </div>
                <div className="bg-zinc-950 rounded-lg border border-white/5 p-3.5 font-mono text-[10px] text-zinc-400 space-y-1.5 max-h-32 overflow-y-auto leading-relaxed select-text">
                  <div className="text-zinc-500">[20:12:05] Initializing mDNS responder daemon on all network interfaces...</div>
                  <div className="text-amber-500">[20:12:06] Discovery multicast socket listening on UDP :5353 (IETF standard)</div>
                  <div className="text-zinc-500">[20:12:08] Found TCP socket port :3000 accessible via dev containment proxy</div>
                  <div className="text-blue-400">[20:12:12] Broadcast ping query sent to service _filebridge._tcp.local</div>
                  <div className="text-emerald-400">[20:12:14] Successfully synchronized local cache parameters footprint: OK</div>
                </div>
              </div>

              {/* SECTION 5: DIAGNOSTICS MAINTENANCE */}
              <div className="flex justify-between items-center bg-zinc-900/10 p-1.5 rounded-lg border border-white/5 pt-3">
                <div className="flex items-center gap-1 text-[11px] text-zinc-550">
                  <Info className="w-3.5 h-3.5" />
                  <span>Local Server Node Signature SHA-256 matches: 7fa35c02b8d910...</span>
                </div>
                <button
                  onClick={onRestoreDefaults}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer border border-white/5"
                  title="Reset to specifications definitions"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Defaults
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* WINDOWS DIRECTORY SELECTION WORKSPACE MODAL */}
      {isFolderPickerOpen && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-200 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col w-full max-w-2xl h-[520px] overflow-hidden text-zinc-100 font-sans">
            
            {/* Title Bar block */}
            <div className="bg-zinc-950/60 border-b border-white/5 px-4 py-3 flex items-center justify-between select-none">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <FolderOpen className="w-4 h-4 text-blue-400" />
                <span>Select Folder</span>
              </div>
              <button 
                onClick={() => setIsFolderPickerOpen(false)}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Close Folder Selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Navigation row */}
            <div className="bg-zinc-950/30 border-b border-white/5 p-2.5 flex items-center gap-2.5 flex-wrap select-none">
              <button
                disabled={pickerHistoryIdx === 0}
                onClick={handleBack}
                className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-300 cursor-pointer disabled:cursor-not-allowed transition"
                title="Back in history"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <button
                disabled={pickerHistoryIdx === pickerHistory.length - 1}
                onClick={handleForward}
                className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-300 cursor-pointer disabled:cursor-not-allowed transition"
                title="Forward in history"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                disabled={!(fs[pickerPath]?.parent)}
                onClick={handleUpLevel}
                className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-300 cursor-pointer disabled:cursor-not-allowed transition"
                title="Up one level"
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              {/* Editable Address Breadcrumb container */}
              <div className="flex-1 min-w-0 bg-zinc-950/60 border border-white/5 rounded px-2.5 py-1 text-xs font-mono text-zinc-300 truncate">
                {pickerPath === 'This PC' ? (
                  <span className="text-zinc-500">This PC</span>
                ) : (
                  <div className="flex items-center gap-1.5 select-text">
                    <span className="text-zinc-500 hover:text-blue-400 cursor-pointer hover:underline" onClick={() => navigateTo('This PC')}>This PC</span>
                    <span className="text-zinc-700">&gt;</span>
                    {pickerPath.split('\\').map((node, index, arr) => {
                      if (!node) return null;
                      const nodePath = arr.slice(0, index + 1).join('\\') + (index === 0 ? '\\' : '');
                      const isLast = index === arr.length - 1;
                      return (
                        <span key={index} className="flex items-center gap-1.5">
                          <span 
                            className={`${isLast ? 'text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-blue-400 cursor-pointer hover:underline'}`}
                            onClick={() => !isLast && navigateTo(nodePath)}
                          >
                            {node}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fast Folder search filtering wrapper */}
              <div className="relative w-40 shrink-0">
                <input
                  type="text"
                  placeholder="Search subfolders..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-white/5 rounded px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-sans pl-7"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Split Panel view workspace */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-zinc-900/50">
              
              {/* Left sidebar: Core Windows anchor drives */}
              <div className="w-[180px] bg-zinc-950/20 border-r border-white/5 overflow-y-auto p-2 text-xs space-y-4 select-none shrink-0 text-left">
                <div>
                  <h4 className="px-2 pb-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Quick Access</h4>
                  <div className="space-y-0.5">
                    {[
                      { name: 'Desktop', path: 'C:\\Users\\Pavan\\Desktop' },
                      { name: 'Downloads', path: 'C:\\Users\\Pavan\\Downloads' },
                      { name: 'Documents', path: 'C:\\Users\\Pavan\\Documents' }
                    ].map(item => {
                      const isAt = pickerPath === item.path || pickerPath.startsWith(item.path + '\\');
                      return (
                        <button
                          key={item.name}
                          onClick={() => navigateTo(item.path)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition ${isAt ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'}`}
                        >
                          <Folder className={`w-3.5 h-3.5 ${isAt ? 'text-blue-400 animate-pulse' : 'text-zinc-500'}`} />
                          <span className="truncate">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="px-2 pb-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">This PC</h4>
                  <div className="space-y-0.5">
                    {[
                      { name: 'Local Disk (C:)', path: 'C:\\' },
                      { name: 'Volume (D:)', path: 'D:\\' },
                      { name: 'Portable Disk (E:)', path: 'E:\\' },
                      { name: 'Shared Drive (F:)', path: 'F:\\', isOffline: true }
                    ].map(drive => {
                      const isAt = pickerPath === drive.path || pickerPath.startsWith(drive.path);
                      return (
                        <button
                          key={drive.name}
                          onClick={() => navigateTo(drive.path)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition ${isAt && !drive.isOffline ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'} ${drive.isOffline ? 'hover:text-red-300' : ''}`}
                        >
                          <HardDrive className={`w-3.5 h-3.5 ${drive.isOffline ? 'text-red-500/60' : isAt ? 'text-blue-400' : 'text-zinc-500'}`} />
                          <span className="truncate flex items-center justify-between w-full min-w-0">
                            <span className="truncate">{drive.name}</span>
                            {drive.isOffline && (
                              <span className="text-[8px] bg-red-500/10 text-red-400 px-1 py-[1px] border border-red-500/20 rounded shrink-0 font-sans uppercase tracking-tight scale-90">Offline</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right view panel: Folder listing layout */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0 min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3 block text-left">
                  Folders in: <strong className="text-zinc-400 font-mono">{pickerPath}</strong>
                </span>

                {/* New directory interactive naming field */}
                {showNewFolderInput && (
                  <div className="mb-3.5 p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-center gap-2 animate-fade-in">
                    <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="bg-zinc-950 border border-white/10 rounded px-2.5 py-1 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none focus:border-blue-500 flex-1 min-w-0"
                      placeholder="Folder name (e.g. FileBridge)"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFolder();
                        if (e.key === 'Escape') {
                          setShowNewFolderInput(false);
                          setNewFolderName('');
                        }
                      }}
                    />
                    <button
                      onClick={handleCreateFolder}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded transition shrink-0 cursor-pointer"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewFolderInput(false);
                        setNewFolderName('');
                      }}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition shrink-0 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Main folders rendering list */}
                {(() => {
                  const currentDirectoryData = fs[pickerPath] || { parent: '', children: [] };
                  const childrenDirectories = (currentDirectoryData.children || []).filter(childPath => {
                    const parts = childPath.split('\\');
                    const name = parts[parts.length - 1];
                    return name.toLowerCase().includes(pickerSearch.toLowerCase());
                  });

                  if (childrenDirectories.length === 0) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs border border-dashed border-white/5 rounded-xl">
                        <Folder className="w-8 h-8 text-zinc-650 mb-2 stroke-[1.5]" />
                        <span>This directory contains no subdirectories.</span>
                        <button
                          onClick={() => {
                            setNewFolderName('FileBridge');
                            setShowNewFolderInput(true);
                          }}
                          className="mt-3.5 text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer bg-white/5 px-2.5 py-1.5 rounded hover:bg-white/10 text-[11px]"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          Create "FileBridge" Subfolder
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1 relative select-none">
                      {childrenDirectories.map(childPath => {
                        const parts = childPath.split('\\');
                        const name = parts[parts.length - 1];
                        const isSelected = pickerSelectedInView === childPath;

                        return (
                          <div
                            key={childPath}
                            onClick={() => setPickerSelectedInView(childPath)}
                            onDoubleClick={() => navigateTo(childPath)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left transition duration-150 cursor-pointer group ${
                              isSelected 
                                ? 'bg-blue-600/15 border-blue-500/40 text-blue-300' 
                                : 'bg-zinc-950/10 border-transparent hover:bg-white/5 text-zinc-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate min-w-0">
                              <Folder className={`w-4 h-4 shrink-0 transition-all ${isSelected ? 'text-blue-400 scale-110' : 'text-amber-500/80 group-hover:text-amber-400'}`} />
                              <span className="font-medium text-xs truncate">{name}</span>
                            </div>
                            
                            <span className="text-[9px] font-mono text-zinc-500 opacity-0 group-hover:opacity-80 uppercase shrink-0 transition-opacity">
                              Double Click to Open
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Bottom controller panel action line */}
            <div className="bg-zinc-950/80 border-t border-white/5 p-4 flex flex-col gap-3 shrink-0 select-none">
              
              {/* Error Warning block */}
              {pickerError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-200 font-medium">
                  <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-left leading-relaxed">{pickerError}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-zinc-400 whitespace-nowrap shrink-0">Folder:</span>
                <input
                  type="text"
                  value={pickerSelectedInView || pickerPath}
                  onChange={(e) => {
                    setPickerSelectedInView(e.target.value);
                  }}
                  className="bg-zinc-900 border border-white/10 rounded px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-550 flex-1"
                  placeholder="Input destination path manually..."
                />
              </div>

              <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderName('FileBridge');
                    setShowNewFolderInput(true);
                  }}
                  className="px-3 py-1.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-white/5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition active:translate-y-[1px]"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-zinc-400" />
                  New Folder
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmPath(pickerSelectedInView || pickerPath)}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-zinc-100 text-xs font-semibold select-none cursor-pointer border border-white/5 shadow-md transition-all duration-150 active:translate-y-[1px]"
                  >
                    Select Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFolderPickerOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold select-none cursor-pointer border border-white/5 transition duration-150"
                  >
                    Cancel
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
