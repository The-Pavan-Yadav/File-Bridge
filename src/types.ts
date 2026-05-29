export interface Device {
  id: string;
  name: string;
  type: 'android' | 'windows';
  category?: 'phone' | 'desktop' | 'laptop' | 'tablet';
  batteryPercentage?: number;
  connectionQuality?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  lastSeen?: string;
  ipAddress: string;
  lastActive: string;
  status: 'online' | 'offline' | 'pairing' | 'paired';
  isTrusted: boolean;
  storageFree: string;
  storageTotal: string;
  avatarColor: string; // for high-fidelity avatar icon styling
  nickname?: string;
  pairingKey?: string;
  autoReconnect?: boolean;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: string;
  type: 'folder' | 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'other';
  lastModified: string;
  childCount?: number;
  isFavorite?: boolean;
}

export interface TransferItem {
  id: string;
  fileName: string;
  speed: string;
  progress: number; // 0 to 100
  eta: string;
  status: 'waiting' | 'running' | 'paused' | 'completed' | 'failed';
  size: string;
  direction: 'incoming' | 'outgoing';
  deviceName: string;
}

export interface AppSettings {
  autoStart: boolean;
  defaultDownloadPath: string;
  autoTrustDevices: boolean;
  autoReconnectDevices: boolean;
  port: number;
  preventSleepDuringTransfer: boolean;
  theme: 'dark' | 'light' | 'system';
}
