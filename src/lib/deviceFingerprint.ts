// Device Fingerprinting & Anti-Sybil Validation

export interface DeviceTelemetry {
  deviceId: string;
  devicePlatform: string;
  userAgent: string;
  screenResolution: string;
  cores: number;
  memoryGb?: number;
  timezone: string;
  timestamp: string;
  hardwareHash: string;
}

export function generateDeviceFingerprint(): DeviceTelemetry {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'DEV-NODE-SERVER',
      devicePlatform: 'Node Server',
      userAgent: 'SSR',
      screenResolution: '1920x1080',
      cores: 8,
      timezone: 'Asia/Kolkata',
      timestamp: new Date().toISOString(),
      hardwareHash: '0x' + Math.random().toString(16).substring(2, 10)
    };
  }

  // Retrieve or create persistent device ID in localStorage
  let savedDeviceId = localStorage.getItem('greenproof_device_id');
  if (!savedDeviceId) {
    const randomHex = Array.from(window.crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    savedDeviceId = `GP-NODE-${randomHex}`;
    localStorage.setItem('greenproof_device_id', savedDeviceId);
  }

  const nav = window.navigator as any;
  const screen = window.screen;
  const cores = nav.hardwareConcurrency || 4;
  const memoryGb = nav.deviceMemory || 8;
  const platform = nav.platform || 'Browser';
  const userAgent = nav.userAgent || 'Web';
  const resolution = `${screen.width}x${screen.height} (${screen.colorDepth}-bit)`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  // Compute a simple deterministic hash for hardware specs
  const rawHardwareString = `${savedDeviceId}-${cores}-${memoryGb}-${resolution}-${platform}`;
  let hashVal = 0;
  for (let i = 0; i < rawHardwareString.length; i++) {
    hashVal = (hashVal << 5) - hashVal + rawHardwareString.charCodeAt(i);
    hashVal |= 0;
  }
  const hardwareHash = '0x' + Math.abs(hashVal).toString(16).padStart(8, '0').toUpperCase();

  return {
    deviceId: savedDeviceId,
    devicePlatform: platform,
    userAgent,
    screenResolution: resolution,
    cores,
    memoryGb,
    timezone,
    timestamp: new Date().toLocaleString(),
    hardwareHash
  };
}
