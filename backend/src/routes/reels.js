const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');

const aiServiceClient = require('../services/aiServiceClient');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// Base directories for uploads and output reels
const REELS_BASE_DIR = path.join(__dirname, '..', '..', 'generated', 'reels');
const UPLOADS_DIR = path.join(REELS_BASE_DIR, 'uploads');
const OUTPUT_DIR = path.join(REELS_BASE_DIR, 'output');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const uniqueName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Unsupported video format ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});

// POST /api/reels/upload — Upload long video
router.post('/reels/upload', upload.single('video'), (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No video file provided.');
    }

    const videoPath = req.file.path;
    const filename = req.file.filename;
    const videoUrl = `/media/reels/uploads/${filename}`;

    res.status(201).json({
      status: 'uploaded',
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
      videoPath,
      videoUrl,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reels/process — Transcribe, detect viral clips, and render #1 reel
router.post('/reels/process', async (req, res, next) => {
  try {
    const {
      videoPath,
      filename,
      autoRenderFirst = false,
      aspectRatio = '9:16',
      durationMode = 'auto',
      layoutMode = 'blur',
      subtitleStyle = 'hormozi',
      subtitlePosition = 'bottom',
      fontSizeChoice = 'standard',
      trimSilence = false,
      bgmPreset = 'none',
      targetCount,
      timeRange,
    } = req.body;
    const resolvedPath = videoPath || (filename ? path.join(UPLOADS_DIR, filename) : null);

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      throw new ApiError(400, `Video file does not exist at: ${resolvedPath}`);
    }

    const result = await aiServiceClient.processReels(resolvedPath, autoRenderFirst, OUTPUT_DIR, {
      aspectRatio,
      durationMode,
      layoutMode,
      subtitleStyle,
      subtitlePosition,
      fontSizeChoice,
      trimSilence,
      bgmPreset,
      targetCount,
      timeRange,
    });

    // Map any rendered reel filepaths to accessible media URLs
    if (Array.isArray(result.clips)) {
      for (const clip of result.clips) {
        if (clip.rendered_reel && clip.rendered_reel.filename) {
          clip.rendered_reel.reelUrl = `/media/reels/output/${clip.rendered_reel.filename}`;
        }
      }
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/reels/render — Render a specific clip with chosen layout, aspect ratio & subtitle style
router.post('/reels/render', async (req, res, next) => {
  try {
    const {
      videoPath,
      filename,
      startTime,
      endTime,
      words,
      aspectRatio = '9:16',
      layoutMode = 'blur',
      subtitleStyle = 'hormozi',
      subtitlePosition = 'bottom',
      fontSizeChoice = 'standard',
      trimSilence = false,
      bgmPreset = 'none',
    } = req.body;
    const resolvedPath = videoPath || (filename ? path.join(UPLOADS_DIR, filename) : null);

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      throw new ApiError(400, `Video file does not exist at: ${resolvedPath}`);
    }
    if (typeof startTime !== 'number' || typeof endTime !== 'number' || endTime <= startTime) {
      throw new ApiError(400, 'Invalid startTime or endTime provided.');
    }

    const rendered = await aiServiceClient.renderReel(
      resolvedPath,
      startTime,
      endTime,
      words || [],
      OUTPUT_DIR,
      {
        aspectRatio,
        layoutMode,
        subtitleStyle,
        subtitlePosition,
        fontSizeChoice,
        trimSilence,
        bgmPreset,
      }
    );

    rendered.reelUrl = `/media/reels/output/${rendered.filename}`;

    res.status(200).json({
      status: 'rendered',
      reel: rendered,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reels/batch-render — Export multiple aspect ratios at once (Option 5)
router.post('/reels/batch-render', async (req, res, next) => {
  try {
    const {
      videoPath,
      filename,
      startTime,
      endTime,
      words,
      ratios = ['9:16', '1:1', '16:9'],
      layoutMode = 'blur',
      subtitleStyle = 'hormozi',
      subtitlePosition = 'bottom',
      fontSizeChoice = 'standard',
      trimSilence = false,
      bgmPreset = 'none',
    } = req.body;

    const resolvedPath = videoPath || (filename ? path.join(UPLOADS_DIR, filename) : null);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      throw new ApiError(400, `Video file does not exist at: ${resolvedPath}`);
    }

    const renderedList = [];
    for (const ratio of ratios) {
      const rendered = await aiServiceClient.renderReel(
        resolvedPath,
        startTime,
        endTime,
        words || [],
        OUTPUT_DIR,
        {
          aspectRatio: ratio,
          layoutMode: ratio === '16:9' ? 'direct_crop' : layoutMode,
          subtitleStyle,
          subtitlePosition,
          fontSizeChoice,
          trimSilence,
          bgmPreset,
        }
      );
      rendered.reelUrl = `/media/reels/output/${rendered.filename}`;
      renderedList.push(rendered);
    }

    res.status(200).json({
      status: 'batch_rendered',
      renders: renderedList,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reels — List all rendered reels
router.get('/reels', (req, res, next) => {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return res.status(200).json({ reels: [] });
    }

    const files = fs
      .readdirSync(OUTPUT_DIR)
      .filter((f) => f.endsWith('.mp4'))
      .map((f) => {
        const stat = fs.statSync(path.join(OUTPUT_DIR, f));
        return {
          filename: f,
          reelUrl: `/media/reels/output/${f}`,
          createdAt: stat.birthtime,
          size: stat.size,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({ reels: files });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
