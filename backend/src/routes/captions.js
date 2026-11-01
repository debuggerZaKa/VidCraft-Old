const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');

const aiServiceClient = require('../services/aiServiceClient');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

const CAPTIONS_BASE_DIR = path.join(__dirname, '..', '..', 'generated', 'captions');
const UPLOADS_DIR = path.join(CAPTIONS_BASE_DIR, 'uploads');
const EXPORT_DIR = path.join(CAPTIONS_BASE_DIR, 'exports');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(EXPORT_DIR, { recursive: true });

// Configure Multer storage for both audio and video files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const uniqueName = `caption_media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      '.mp4', '.mov', '.avi', '.mkv', '.webm',
      '.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Unsupported media format ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});

// POST /api/captions/upload — Upload audio or video for auto captioning
router.post('/captions/upload', upload.single('media'), (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No audio or video file provided.');
    }

    const mediaPath = req.file.path;
    const filename = req.file.filename;
    const mediaUrl = `/media/captions/uploads/${filename}`;
    const isAudioOnly = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'].includes(
      path.extname(filename).toLowerCase()
    );

    res.status(201).json({
      status: 'uploaded',
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mediaPath,
      mediaUrl,
      isAudioOnly,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/captions/transcribe — Transcribe audio/video with Urdu & English support
router.post('/captions/transcribe', async (req, res, next) => {
  try {
    const { mediaPath, filename, language } = req.body;
    const resolvedPath = mediaPath || (filename ? path.join(UPLOADS_DIR, filename) : null);

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      throw new ApiError(400, `Media file does not exist at: ${resolvedPath}`);
    }

    const result = await aiServiceClient.transcribeCaptions(resolvedPath, language);

    // Map audio path to media URL if available
    let audioUrl = null;
    if (result.audio_path && fs.existsSync(result.audio_path)) {
      const baseName = path.basename(result.audio_path);
      const destPath = path.join(UPLOADS_DIR, baseName);
      if (result.audio_path !== destPath) {
        try {
          fs.copyFileSync(result.audio_path, destPath);
          audioUrl = `/media/captions/uploads/${baseName}`;
        } catch (_) {}
      } else {
        audioUrl = `/media/captions/uploads/${baseName}`;
      }
    }

    res.status(200).json({
      status: 'transcribed',
      text: result.text,
      language: result.language || language || 'en',
      words: result.words || [],
      segments: result.segments || [],
      audioUrl: audioUrl || (filename ? `/media/captions/uploads/${filename}` : null),
      is_simulated: !!result.is_simulated,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/captions/export — Export ASS, SRT, VTT, or JSON
router.post('/captions/export', (req, res, next) => {
  try {
    const { format = 'srt', words = [], settings = {}, title = 'captions' } = req.body;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
    const filename = `${cleanTitle}_${Date.now()}.${format}`;
    const filePath = path.join(EXPORT_DIR, filename);

    let content = '';
    if (format === 'srt') {
      content = generateSrtContent(words);
    } else if (format === 'vtt') {
      content = generateVttContent(words);
    } else if (format === 'ass') {
      content = generateAssContent(words, settings);
    } else if (format === 'json') {
      content = JSON.stringify({ words, settings }, null, 2);
    } else {
      content = words.map(w => w.word).join(' ');
    }

    fs.writeFileSync(filePath, content, 'utf-8');

    res.status(200).json({
      status: 'exported',
      filename,
      downloadUrl: `/media/captions/exports/${filename}`,
      content,
    });
  } catch (err) {
    next(err);
  }
});

function formatTimeSrt(sec) {
  const s = Math.max(0, sec || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const millis = Math.floor((s - Math.floor(s)) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

function formatTimeVtt(sec) {
  const s = Math.max(0, sec || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const millis = Math.floor((s - Math.floor(s)) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function generateSrtContent(words) {
  const entries = [];
  const batchSize = 3;
  let index = 1;

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    if (!batch.length) continue;
    const start = batch[0].start;
    const end = batch[batch.length - 1].end;
    const text = batch.map(b => b.word).join(' ');
    entries.push(`${index}\n${formatTimeSrt(start)} --> ${formatTimeSrt(end)}\n${text}\n`);
    index++;
  }
  return entries.join('\n');
}

function generateVttContent(words) {
  const lines = ['WEBVTT\n'];
  const batchSize = 3;

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    if (!batch.length) continue;
    const start = batch[0].start;
    const end = batch[batch.length - 1].end;
    const text = batch.map(b => b.word).join(' ');
    lines.push(`${formatTimeVtt(start)} --> ${formatTimeVtt(end)}\n${text}\n`);
  }
  return lines.join('\n');
}

function generateAssContent(words, settings = {}) {
  const font = settings.fontFamily || 'Arial';
  const fontSize = settings.fontSize || 54;
  const textColor = '&H0000FFFF'; // ASS color
  const outlineColor = '&H00000000';
  const outline = settings.strokeWidth || 4;
  const shadow = settings.shadowBlur ? 3 : 1;

  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: AutoCaption,${font},${fontSize},${textColor},&H00FFFFFF,${outlineColor},&H80000000,-1,0,0,0,100,100,0,0,1,${outline},${shadow},2,40,40,320,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${words.map(w => `Dialogue: 0,${formatTimeVtt(w.start).substring(1)},${formatTimeVtt(w.end).substring(1)},AutoCaption,,0,0,0,,${w.word}`).join('\n')}
`;
}

module.exports = router;
