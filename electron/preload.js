const { contextBridge } = require('electron');

// Minimal, safe bridge for the MoodHub renderer.
// MoodHub is local-first: only runtime/version info is exposed, no Node APIs.
contextBridge.exposeInMainWorld('moodhub', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
