import express from "express";
import path from "path";
import os from "os";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Memory store for discovered devices
interface MemoryDevice {
  id: string;
  name: string;
  type: 'android' | 'windows';
  category?: 'phone' | 'desktop' | 'laptop' | 'tablet';
  batteryPercentage?: number;
  connectionQuality?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  ipAddress: string;
  status: 'online' | 'offline';
  lastSeenTime: number; // timestamp
  isTrusted: boolean;
  storageFree: string;
  storageTotal: string;
  avatarColor: string;
}

let activeDevices: Record<string, MemoryDevice> = {};

// Root API endpoints for discovery
app.get("/api/discovery/devices", (req, res) => {
  const now = Date.now();
  
  // Prune dead nodes (stale for more than 45 seconds)
  Object.keys(activeDevices).forEach(id => {
    if (now - activeDevices[id].lastSeenTime > 45000) {
      delete activeDevices[id];
    }
  });

  // Map state of devices for online/offline flag
  const list = Object.values(activeDevices).map(device => {
    // If we haven't seen a heartbeat in 12 seconds, mark offline
    const isOnline = (now - device.lastSeenTime) <= 12000;
    const secondsAgo = Math.round((now - device.lastSeenTime) / 1000);
    
    let lastSeenText = "Active now";
    if (secondsAgo > 3) {
      lastSeenText = `${secondsAgo}s ago`;
    }
    if (!isOnline) {
      lastSeenText = `${secondsAgo}s ago (Offline)`;
    }

    return {
      ...device,
      status: isOnline ? ("online" as const) : ("offline" as const),
      lastSeen: lastSeenText,
      lastActive: lastSeenText
    };
  });

  res.json(list);
});

app.post("/api/discovery/register", (req, res) => {
  const { 
    id, name, type, category, batteryPercentage, connectionQuality, 
    ipAddress, isTrusted, storageFree, storageTotal, avatarColor 
  } = req.body;

  if (!id || !name || !type) {
    return res.status(400).json({ error: "Missing required fields (id, name, type)" });
  }

  // Derive client IP if none passed
  let remoteIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1")
    .replace(/^.*:/, ""); // clean IPv6 leading loopback prefix if any
  if (remoteIp === "1" || remoteIp === "localhost") {
    remoteIp = "127.0.0.1";
  }

  activeDevices[id] = {
    id,
    name,
    type,
    category: category || (type === 'windows' ? 'laptop' : 'phone'),
    batteryPercentage: batteryPercentage !== undefined ? batteryPercentage : 85,
    connectionQuality: connectionQuality || 'Excellent',
    ipAddress: ipAddress || remoteIp || '191.168.1.100',
    status: 'online',
    lastSeenTime: Date.now(),
    isTrusted: isTrusted ?? false,
    storageFree: storageFree || '102 GB',
    storageTotal: storageTotal || '256 GB',
    avatarColor: avatarColor || 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
  };

  res.json({ success: true, device: activeDevices[id] });
});

// GET host info helper
app.get("/api/discovery/host-info", (req, res) => {
  try {
    const hostname = os.hostname();
    const networkInterfaces = os.networkInterfaces();
    let localIp = "127.0.0.1";

    // Find the first non-internal IPv4 address
    for (const name of Object.keys(networkInterfaces)) {
      const inet = networkInterfaces[name];
      if (inet) {
        for (const net of inet) {
          if (net.family === "IPv4" && !net.internal) {
            localIp = net.address;
            break;
          }
        }
      }
    }

    res.json({
      hostname,
      localIp,
      platform: os.platform(),
      release: os.release()
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to read system status metadata" });
  }
});

// Vite middleware for development or serving dist folder in static production build
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server executing live on node port ${PORT}`);
  });
}

setupServer();
