require('dotenv').config();

const express = require('express');
const path = require('path');
const { buildWorkbookSnapshot, writeSnapshotToDisk, OUTPUT_FILE } = require('./scripts/build-static-data');

const app = express();
const PORT = process.env.PORT || 5000;

// Background sync हर 15-30 minute के बीच chalta rahe — env value को उसी range में clamp कर देते हैं।
const SYNC_INTERVAL_MINUTES = Math.min(30, Math.max(15, Number(process.env.SYNC_INTERVAL_MINUTES) || 20));
const SYNC_INTERVAL_MS = SYNC_INTERVAL_MINUTES * 60 * 1000;

let lastSyncMeta = null;
let lastSyncError = null;
let isSyncing = false;
let syncTimer = null;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Google Drive se workbook download + parse karke public/data/workbook.json
 * ko dobara likhta hai. Overlapping syncs ko rokne ke liye isSyncing guard hai.
 */
async function syncWorkbookFromGoogleDrive(trigger = 'background') {
  if (isSyncing) {
    console.log(`⏳ [${trigger}] Sync पहले से चल रही है, यह request skip की जा रही है।`);
    return lastSyncMeta;
  }

  isSyncing = true;
  try {
    console.log(`☁️  [${trigger}] Google Drive से workbook sync शुरू...`);
    const { payload } = await buildWorkbookSnapshot();
    await writeSnapshotToDisk(payload);
    lastSyncMeta = payload.meta;
    lastSyncError = null;
    console.log(`✅ [${trigger}] Sync पूरा हुआ — version ${payload.meta.version}, ${payload.meta.lastUpdatedDisplay}`);
    return lastSyncMeta;
  } catch (err) {
    lastSyncError = err.message;
    console.error(`❌ [${trigger}] Sync fail हुआ:`, err.message);
    throw err;
  } finally {
    isSyncing = false;
  }
}

// Manual/UI-triggered "ताज़ा सिंक" — दोनों GET और POST support करते हैं ताकि
// browser से लिंक खोलकर भी और fetch() से भी call किया जा सके।
async function handleRefresh(req, res) {
  try {
    const meta = await syncWorkbookFromGoogleDrive('manual-refresh');
    res.json({ success: true, meta });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
app.post('/api/refresh', handleRefresh);
app.get('/api/refresh', handleRefresh);

// Debug/monitoring ke liye — last sync ka status dikhata hai.
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    isSyncing,
    lastSyncMeta,
    lastSyncError,
    syncIntervalMinutes: SYNC_INTERVAL_MINUTES,
    workbookFile: OUTPUT_FILE
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SBM-G server चल रहा है: http://localhost:${PORT}`);
  console.log(`🔁 Background auto-sync हर ${SYNC_INTERVAL_MINUTES} minute में चलेगा।`);

  // Startup पर तुरंत एक बार sync करो, फिर interval पर चलते रहो।
  syncWorkbookFromGoogleDrive('startup').catch(() => {
    /* error already logged inside syncWorkbookFromGoogleDrive */
  });

  syncTimer = setInterval(() => {
    syncWorkbookFromGoogleDrive('scheduled').catch(() => {});
  }, SYNC_INTERVAL_MS);
});

process.on('SIGTERM', () => {
  if (syncTimer) clearInterval(syncTimer);
  process.exit(0);
});

module.exports = app;
