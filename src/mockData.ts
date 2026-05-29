import { Device, FileItem, TransferItem, AppSettings } from './types';

export const initialDevices: Device[] = [
  {
    id: 'dev-pixel8',
    name: 'Pixel 8 Pro',
    type: 'android',
    category: 'phone',
    batteryPercentage: 84,
    connectionQuality: 'Excellent',
    lastSeen: 'Active now',
    ipAddress: '192.168.1.142',
    lastActive: 'Just now',
    status: 'online',
    isTrusted: true,
    storageFree: '128 GB',
    storageTotal: '256 GB',
    avatarColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'dev-s24',
    name: 'Galaxy S24 Ultra',
    type: 'android',
    category: 'phone',
    batteryPercentage: 95,
    connectionQuality: 'Good',
    lastSeen: '2 mins ago',
    ipAddress: '192.168.1.189',
    lastActive: '2 mins ago',
    status: 'online',
    isTrusted: false,
    storageFree: '342 GB',
    storageTotal: '512 GB',
    avatarColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'dev-tab-s9',
    name: 'Galaxy Tab S9 Ultra',
    type: 'android',
    category: 'tablet',
    batteryPercentage: 72,
    connectionQuality: 'Excellent',
    lastSeen: 'Active now',
    ipAddress: '192.168.1.133',
    lastActive: 'Just now',
    status: 'online',
    isTrusted: true,
    storageFree: '94 GB',
    storageTotal: '128 GB',
    avatarColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  },
  {
    id: 'dev-dell-xps',
    name: 'Dell XPS 15',
    type: 'windows',
    category: 'laptop',
    batteryPercentage: 42,
    connectionQuality: 'Good',
    lastSeen: '5 mins ago',
    ipAddress: '192.168.1.110',
    lastActive: '5 mins ago',
    status: 'online',
    isTrusted: false,
    storageFree: '450 GB',
    storageTotal: '1.0 TB',
    avatarColor: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  },
  {
    id: 'dev-win-couch',
    name: 'Living Room PC',
    type: 'windows',
    category: 'desktop',
    connectionQuality: 'Poor',
    lastSeen: '1 hour ago',
    ipAddress: '192.168.1.105',
    lastActive: '1 hour ago',
    status: 'offline',
    isTrusted: true,
    storageFree: '1.2 TB',
    storageTotal: '2.0 TB',
    avatarColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
];

export const mockFileSystems: Record<string, FileItem[]> = {
  // C:\Users\FileBridge
  'C:\\Users\\FileBridge': [
    { name: 'Downloads', path: 'C:\\Users\\FileBridge\\Downloads', isDirectory: true, type: 'folder', lastModified: 'May 28, 2026, 3:14 PM', childCount: 4, isFavorite: true },
    { name: 'Documents', path: 'C:\\Users\\FileBridge\\Documents', isDirectory: true, type: 'folder', lastModified: 'May 25, 2026, 11:22 AM', childCount: 2, isFavorite: true },
    { name: 'Pictures', path: 'C:\\Users\\FileBridge\\Pictures', isDirectory: true, type: 'folder', lastModified: 'May 29, 2026, 9:05 AM', childCount: 3, isFavorite: false },
    { name: 'Videos', path: 'C:\\Users\\FileBridge\\Videos', isDirectory: true, type: 'folder', lastModified: 'May 20, 2026, 4:40 PM', childCount: 1, isFavorite: false },
    { name: 'SystemLogs.log', path: 'C:\\Users\\FileBridge\\SystemLogs.log', isDirectory: false, size: '42 KB', type: 'other', lastModified: 'May 29, 2026, 12:12 PM' },
    { name: 'Readme_Setup.md', path: 'C:\\Users\\FileBridge\\Readme_Setup.md', isDirectory: false, size: '12 KB', type: 'document', lastModified: 'May 22, 2026, 2:30 PM' },
  ],
  // C:\Users\FileBridge\Downloads
  'C:\\Users\\FileBridge\\Downloads': [
    { name: 'android-sdk-tools.zip', path: 'C:\\Users\\FileBridge\\Downloads\\android-sdk-tools.zip', isDirectory: false, size: '142.4 MB', type: 'other', lastModified: 'May 28, 2026, 2:10 PM' },
    { name: 'photo_trip_2026.jpg', path: 'C:\\Users\\FileBridge\\Downloads\\photo_trip_2026.jpg', isDirectory: false, size: '4.2 MB', type: 'image', lastModified: 'May 27, 2026, 11:15 AM' },
    { name: 'presentation_draft.pptx', path: 'C:\\Users\\FileBridge\\Downloads\\presentation_draft.pptx', isDirectory: false, size: '18.7 MB', type: 'document', lastModified: 'May 28, 2026, 12:01 PM' },
    { name: 'contract_final.pdf', path: 'C:\\Users\\FileBridge\\Downloads\\contract_final.pdf', isDirectory: false, size: '1.8 MB', type: 'pdf', lastModified: 'May 25, 2026, 9:22 AM' },
  ],
  // C:\Users\FileBridge\Documents
  'C:\\Users\\FileBridge\\Documents': [
    { name: 'Project_Specs', path: 'C:\\Users\\FileBridge\\Documents\\Project_Specs', isDirectory: true, type: 'folder', lastModified: 'May 24, 2026, 5:30 PM', childCount: 2 },
    { name: 'Finances_2026.xlsx', path: 'C:\\Users\\FileBridge\\Documents\\Finances_2026.xlsx', isDirectory: false, size: '1.2 MB', type: 'document', lastModified: 'May 25, 2026, 11:22 AM' },
  ],
  // C:\Users\FileBridge\Documents\Project_Specs
  'C:\\Users\\FileBridge\\Documents\\Project_Specs': [
    { name: 'architecture_v2.pdf', path: 'C:\\Users\\FileBridge\\Documents\\Project_Specs\\architecture_v2.pdf', isDirectory: false, size: '8.4 MB', type: 'pdf', lastModified: 'May 22, 2026, 10:04 AM' },
    { name: 'mockups_approved.png', path: 'C:\\Users\\FileBridge\\Documents\\Project_Specs\\mockups_approved.png', isDirectory: false, size: '3.6 MB', type: 'image', lastModified: 'May 21, 2026, 1:15 PM' },
  ],
  // C:\Users\FileBridge\Pictures
  'C:\\Users\\FileBridge\\Pictures': [
    { name: 'Camera_Roll', path: 'C:\\Users\\FileBridge\\Pictures\\Camera_Roll', isDirectory: true, type: 'folder', lastModified: 'May 19, 2026, 8:44 AM', childCount: 2 },
    { name: 'Wallpapers', path: 'C:\\Users\\FileBridge\\Pictures\\Wallpapers', isDirectory: true, type: 'folder', lastModified: 'May 20, 2026, 12:00 PM', childCount: 3 },
    { name: 'profile_pic.png', path: 'C:\\Users\\FileBridge\\Pictures\\profile_pic.png', isDirectory: false, size: '1.1 MB', type: 'image', lastModified: 'May 29, 2026, 9:05 AM' },
  ],
  'C:\\Users\\FileBridge\\Pictures\\Camera_Roll': [
    { name: 'IMG_20260412.jpg', path: 'C:\\Users\\FileBridge\\Pictures\\Camera_Roll\\IMG_20260412.jpg', isDirectory: false, size: '2.4 MB', type: 'image', lastModified: 'Apr 12, 2026, 4:12 PM' },
    { name: 'IMG_20260413.jpg', path: 'C:\\Users\\FileBridge\\Pictures\\Camera_Roll\\IMG_20260413.jpg', isDirectory: false, size: '3.1 MB', type: 'image', lastModified: 'Apr 13, 2026, 9:44 AM' },
  ],
  'C:\\Users\\FileBridge\\Pictures\\Wallpapers': [
    { name: 'aurora_borealis_4k.jpg', path: 'C:\\Users\\FileBridge\\Pictures\\Wallpapers\\aurora_borealis_4k.jpg', isDirectory: false, size: '8.9 MB', type: 'image', lastModified: 'May 15, 2026, 11:20 PM' },
    { name: 'minimalist_mountain.jpg', path: 'C:\\Users\\FileBridge\\Pictures\\Wallpapers\\minimalist_mountain.jpg', isDirectory: false, size: '4.5 MB', type: 'image', lastModified: 'May 16, 2026, 2:10 PM' },
    { name: 'digital_abstract_purple.jpg', path: 'C:\\Users\\FileBridge\\Pictures\\Wallpapers\\digital_abstract_purple.jpg', isDirectory: false, size: '12.2 MB', type: 'image', lastModified: 'May 20, 2026, 12:00 PM' },
  ],
  // C:\Users\FileBridge\Videos
  'C:\\Users\\FileBridge\\Videos': [
    { name: 'demo_reel_1080p.mp4', path: 'C:\\Users\\FileBridge\\Videos\\demo_reel_1080p.mp4', isDirectory: false, size: '84.2 MB', type: 'video', lastModified: 'May 20, 2026, 4:40 PM' },
  ],

  // REMOTE DEVICE FILES: Pixel 8 Pro Storage Root
  'Pixel 8 Pro\\Internal Storage': [
    { name: 'Download', path: 'Pixel 8 Pro\\Internal Storage\\Download', isDirectory: true, type: 'folder', lastModified: 'May 29, 2026, 2:40 PM', childCount: 2, isFavorite: true },
    { name: 'DCIM', path: 'Pixel 8 Pro\\Internal Storage\\DCIM', isDirectory: true, type: 'folder', lastModified: 'May 29, 2026, 5:10 PM', childCount: 2, isFavorite: true },
    { name: 'Documents', path: 'Pixel 8 Pro\\Internal Storage\\Documents', isDirectory: true, type: 'folder', lastModified: 'May 28, 2026, 10:14 AM', childCount: 1, isFavorite: false },
    { name: 'Music', path: 'Pixel 8 Pro\\Internal Storage\\Music', isDirectory: true, type: 'folder', lastModified: 'May 15, 2026, 3:30 AM', childCount: 1, isFavorite: false },
  ],
  'Pixel 8 Pro\\Internal Storage\\Download': [
    { name: 'plane_ticket.pdf', path: 'Pixel 8 Pro\\Internal Storage\\Download\\plane_ticket.pdf', isDirectory: false, size: '1.2 MB', type: 'pdf', lastModified: 'May 29, 2026, 2:35 PM' },
    { name: 'filebridge_android_v1.0.apk', path: 'Pixel 8 Pro\\Internal Storage\\Download\\filebridge_android_v1.0.apk', isDirectory: false, size: '32.1 MB', type: 'other', lastModified: 'May 29, 2026, 2:40 PM' },
  ],
  'Pixel 8 Pro\\Internal Storage\\DCIM': [
    { name: 'Camera', path: 'Pixel 8 Pro\\Internal Storage\\DCIM\\Camera', isDirectory: true, type: 'folder', lastModified: 'May 29, 2026, 5:10 PM', childCount: 2 },
    { name: 'Screenshots', path: 'Pixel 8 Pro\\Internal Storage\\DCIM\\Screenshots', isDirectory: true, type: 'folder', lastModified: 'May 22, 2026, 9:20 AM', childCount: 1 },
  ],
  'Pixel 8 Pro\\Internal Storage\\DCIM\\Camera': [
    { name: 'PXL_20260529_1701.jpg', path: 'Pixel 8 Pro\\Internal Storage\\DCIM\\Camera\\PXL_20260529_1701.jpg', isDirectory: false, size: '5.4 MB', type: 'image', lastModified: 'May 29, 2026, 5:02 PM' },
    { name: 'PXL_20260529_1702.jpg', path: 'Pixel 8 Pro\\Internal Storage\\DCIM\\Camera\\PXL_20260529_1702.jpg', isDirectory: false, size: '4.8 MB', type: 'image', lastModified: 'May 29, 2026, 5:05 PM' },
  ],
  'Pixel 8 Pro\\Internal Storage\\DCIM\\Screenshots': [
    { name: 'Screenshot_20260522.png', path: 'Pixel 8 Pro\\Internal Storage\\DCIM\\Screenshots\\Screenshot_20260522.png', isDirectory: false, size: '920 KB', type: 'image', lastModified: 'May 22, 2026, 9:20 AM' },
  ],
  'Pixel 8 Pro\\Internal Storage\\Documents': [
    { name: 'resume_engineer.docx', path: 'Pixel 8 Pro\\Internal Storage\\Documents\\resume_engineer.docx', isDirectory: false, size: '180 KB', type: 'document', lastModified: 'May 28, 2026, 10:14 AM' },
  ],
  'Pixel 8 Pro\\Internal Storage\\Music': [
    { name: 'chill_lofi_beat.mp3', path: 'Pixel 8 Pro\\Internal Storage\\Music\\chill_lofi_beat.mp3', isDirectory: false, size: '6.4 MB', type: 'audio', lastModified: 'May 12, 2026, 11:30 PM' },
  ],
};

export const initialTransfers: TransferItem[] = [
  {
    id: 'tr-1',
    fileName: 'photo_trip_2026.jpg',
    speed: '48.2 MB/s',
    progress: 100,
    eta: 'Completed',
    status: 'completed',
    size: '4.2 MB',
    direction: 'outgoing',
    deviceName: 'Pixel 8 Pro',
  },
  {
    id: 'tr-2',
    fileName: 'aurora_borealis_4k.jpg',
    speed: '12.4 MB/s',
    progress: 100,
    eta: 'Completed',
    status: 'completed',
    size: '8.9 MB',
    direction: 'incoming',
    deviceName: 'Pixel 8 Pro',
  },
  {
    id: 'tr-3',
    fileName: 'demo_reel_1080p.mp4',
    speed: '42.8 MB/s',
    progress: 68,
    eta: '0:02',
    status: 'running',
    size: '84.2 MB',
    direction: 'outgoing',
    deviceName: 'Pixel 8 Pro',
  },
  {
    id: 'tr-4',
    fileName: 'resume_engineer.docx',
    speed: '0 KB/s',
    progress: 0,
    eta: '1s',
    status: 'waiting',
    size: '180 KB',
    direction: 'incoming',
    deviceName: 'Pixel 8 Pro',
  },
  {
    id: 'tr-5',
    fileName: 'vlog_draft_4k_uncompressed.mov',
    speed: '0 KB/s',
    progress: 45,
    eta: 'Failed',
    status: 'failed',
    size: '890.5 MB',
    direction: 'outgoing',
    deviceName: 'Galaxy S24 Ultra',
  },
  {
    id: 'tr-6',
    fileName: 'database_backup_v2.sql',
    speed: '0 KB/s',
    progress: 12,
    eta: 'Failed',
    status: 'failed',
    size: '1.2 GB',
    direction: 'incoming',
    deviceName: 'Pixel 8 Pro',
  },
];

export const defaultSettings: AppSettings = {
  autoStart: true,
  defaultDownloadPath: 'C:\\Users\\FileBridge\\Downloads',
  autoTrustDevices: true,
  autoReconnectDevices: true,
  port: 5353,
  preventSleepDuringTransfer: true,
  theme: 'dark',
};
