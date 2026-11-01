const express = require('express');

const Prompt = require('../models/Prompt');
const generationService = require('../services/generationService');
const imagePromptEnhancer = require('../services/imagePromptEnhancer');
const aiServiceClient = require('../services/aiServiceClient');
const { IMAGE_PROVIDERS } = require('../constants/renderProviders');
const { requireFields, requireOneOf } = require('../middleware/validation');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/images/styles — returns the complete curated Fooocus image styles catalog
router.get('/images/styles', (req, res) => {
  const catalog = imagePromptEnhancer.getAvailableStyles();
  res.json(catalog);
});

// POST /api/images — single-image mode with optional corpus toggle (useCorpus: true/false).
// When useCorpus is true (default): applies 12k Midjourney RAG Exemplars + Groq Prompt Architect.
// When useCorpus is false: generates directly from the raw user prompt without any enhancement.
router.post(
  '/images',
  requireFields(['promptId', 'provider']),
  requireOneOf('provider', IMAGE_PROVIDERS),
  async (req, res, next) => {
    try {
      const {
        promptId,
        provider,
        styleTokens,
        style,
        negativePrompt,
        seed,
        model,
        useCorpus = true,
        refImage,
        strength = 0.75,
        steps,
        numSteps,
      } = req.body;

      const stepsToUse = steps || numSteps;
      const promptDoc = await Prompt.findById(promptId);
      if (!promptDoc) throw new ApiError(404, `Prompt ${promptId} not found`);

      const basePrompt = promptDoc.clarified_text || promptDoc.raw_text;
      const seedToUse = Number.isInteger(seed) ? seed : Math.floor(Math.random() * 1000000);

      // --- Reference Image Pre-Analysis with Qwen-VL (if refImage provided) ---
      let refAnalysis = null;
      if (refImage) {
        try {
          refAnalysis = await aiServiceClient.analyzeRefImage(refImage);
        } catch (err) {
          console.warn('[images] Reference image analysis warning:', err.message);
          refAnalysis = { subject_anchor: 'distinct subject from reference image' };
        }
      }

      // --- Mode A: WITHOUT Corpus (Raw baseline prompt) ---
      if (useCorpus === false) {
        const rawFilenameId = `${promptDoc.id}-raw`;
        const rawPromptToUse = refAnalysis
          ? `${refAnalysis.subject_anchor}, ${basePrompt}`
          : basePrompt;

        const imageUrl = await generationService.generateSingleImage(
          rawFilenameId,
          provider,
          rawPromptToUse,
          {
            negativePrompt: negativePrompt || undefined,
            seed: seedToUse,
            model,
            steps: stepsToUse,
          },
        );

        promptDoc.image_provider = provider;
        promptDoc.image_url = imageUrl;
        await promptDoc.save();

        return res.status(201).json({
          promptId: promptDoc.id,
          provider,
          useCorpus: false,
          seed: seedToUse,
          originalPrompt: promptDoc.raw_text,
          enhancedPrompt: rawPromptToUse,
          negativePrompt: negativePrompt || null,
          subjectAnchor: refAnalysis?.subject_anchor || null,
          style: {
            id: 'raw',
            name: refAnalysis ? 'Raw Reference Merge' : 'Raw Baseline (No Corpus)',
            category: refAnalysis ? 'reference' : 'none',
            source: 'raw_user_input',
          },
          lighting: null,
          camera: null,
          exemplarsUsed: [],
          imageUrl,
        });
      }

      // --- Mode B: WITH Corpus (12k Midjourney RAG Exemplars + Prompt Architect) ---
      let enhancement;
      if (refAnalysis) {
        try {
          const refExp = await aiServiceClient.expandRefPrompt(
            basePrompt,
            refAnalysis,
            style,
            styleTokens,
            strength,
          );
          enhancement = {
            prompt: refExp.enhanced_prompt,
            negativePrompt: refExp.negative_prompt,
            styleId: 'ref_architect',
            styleName: 'Reference Anchored Architect',
            category: 'reference_guided',
            source: 'qwen_vl_plus_corpus',
            lighting: refExp.lighting,
            camera: refExp.camera,
            exemplarsUsed: refExp.exemplars_used || [],
            subjectAnchor: refExp.subject_anchor,
          };
        } catch (err) {
          console.warn('[images] expandRefPrompt fallback:', err.message);
          enhancement = await imagePromptEnhancer.enhanceImagePromptAsync(
            `${refAnalysis.subject_anchor}, ${basePrompt}`,
            styleTokens,
            { requestedStyle: style, negativePrompt, provider }
          );
        }
      } else {
        enhancement = await imagePromptEnhancer.enhanceImagePromptAsync(basePrompt, styleTokens, {
          requestedStyle: style,
          negativePrompt,
          provider,
        });
      }

      const enhancedFilenameId = `${promptDoc.id}-enhanced`;
      const imageUrl = await generationService.generateSingleImage(
        enhancedFilenameId,
        provider,
        enhancement.prompt,
        {
          negativePrompt: enhancement.negativePrompt,
          seed: seedToUse,
          model,
          steps: stepsToUse,
        },
      );

      promptDoc.image_provider = provider;
      promptDoc.image_url = imageUrl;
      await promptDoc.save();

      res.status(201).json({
        promptId: promptDoc.id,
        provider,
        useCorpus: true,
        seed: seedToUse,
        originalPrompt: promptDoc.raw_text,
        enhancedPrompt: enhancement.prompt,
        negativePrompt: enhancement.negativePrompt,
        subjectAnchor: enhancement.subjectAnchor || refAnalysis?.subject_anchor || null,
        style: {
          id: enhancement.styleId,
          name: enhancement.styleName,
          category: enhancement.category,
          source: enhancement.source,
        },
        lighting: enhancement.lighting,
        camera: enhancement.camera,
        exemplarsUsed: enhancement.exemplarsUsed,
        imageUrl,
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/images/compare — generates BOTH versions (with corpus vs without corpus)
// using the EXACT same random seed so the user can compare before & after side-by-side.
router.post(
  '/images/compare',
  requireFields(['promptId', 'provider']),
  requireOneOf('provider', IMAGE_PROVIDERS),
  async (req, res, next) => {
    try {
      const {
        promptId,
        provider,
        styleTokens,
        style,
        negativePrompt,
        model,
        refImage,
        strength = 0.75,
        steps,
        numSteps,
      } = req.body;
      const stepsToUse = steps || numSteps;
      const promptDoc = await Prompt.findById(promptId);
      if (!promptDoc) throw new ApiError(404, `Prompt ${promptId} not found`);

      const basePrompt = promptDoc.clarified_text || promptDoc.raw_text;
      const seed = req.body.seed ?? Math.floor(Math.random() * 1000000);

      // --- Reference Image Pre-Analysis with Qwen-VL ---
      let refAnalysis = null;
      if (refImage) {
        try {
          refAnalysis = await aiServiceClient.analyzeRefImage(refImage);
        } catch (err) {
          console.warn('[images/compare] Reference analysis warning:', err.message);
          refAnalysis = { subject_anchor: 'distinct subject from reference image' };
        }
      }

      // 1. Generate WITHOUT corpus (Raw baseline)
      const rawPromptToUse = refAnalysis
        ? `${refAnalysis.subject_anchor}, ${basePrompt}`
        : basePrompt;

      const rawImageUrl = await generationService.generateSingleImage(
        `${promptDoc.id}-raw`,
        provider,
        rawPromptToUse,
        {
          negativePrompt: negativePrompt || undefined,
          seed,
          model,
          steps: stepsToUse,
        },
      );

      // 2. Generate WITH 12k corpus (Prompt Architect)
      let enhancement;
      if (refAnalysis) {
        try {
          const refExp = await aiServiceClient.expandRefPrompt(
            basePrompt,
            refAnalysis,
            style,
            styleTokens,
            strength,
          );
          enhancement = {
            prompt: refExp.enhanced_prompt,
            negativePrompt: refExp.negative_prompt,
            styleId: 'ref_architect',
            styleName: 'Reference Anchored Architect',
            category: 'reference_guided',
            source: 'qwen_vl_plus_corpus',
            lighting: refExp.lighting,
            camera: refExp.camera,
            exemplarsUsed: refExp.exemplars_used || [],
            subjectAnchor: refExp.subject_anchor,
          };
        } catch (err) {
          enhancement = await imagePromptEnhancer.enhanceImagePromptAsync(
            `${refAnalysis.subject_anchor}, ${basePrompt}`,
            styleTokens,
            { requestedStyle: style, negativePrompt, provider }
          );
        }
      } else {
        enhancement = await imagePromptEnhancer.enhanceImagePromptAsync(basePrompt, styleTokens, {
          requestedStyle: style,
          negativePrompt,
          provider,
        });
      }

      const enhancedImageUrl = await generationService.generateSingleImage(
        `${promptDoc.id}-enhanced`,
        provider,
        enhancement.prompt,
        {
          negativePrompt: enhancement.negativePrompt,
          seed,
          model,
          steps: stepsToUse,
        },
      );

      res.status(201).json({
        promptId: promptDoc.id,
        provider,
        seed,
        withoutCorpus: {
          useCorpus: false,
          originalPrompt: promptDoc.raw_text,
          enhancedPrompt: rawPromptToUse,
          negativePrompt: negativePrompt || null,
          subjectAnchor: refAnalysis?.subject_anchor || null,
          imageUrl: rawImageUrl,
          style: {
            id: 'raw',
            name: refAnalysis ? 'Raw Reference Merge' : 'Raw Baseline (No Corpus)',
          },
        },
        withCorpus: {
          useCorpus: true,
          originalPrompt: promptDoc.raw_text,
          enhancedPrompt: enhancement.prompt,
          negativePrompt: enhancement.negativePrompt,
          subjectAnchor: enhancement.subjectAnchor || refAnalysis?.subject_anchor || null,
          lighting: enhancement.lighting,
          camera: enhancement.camera,
          exemplarsUsed: enhancement.exemplarsUsed,
          imageUrl: enhancedImageUrl,
          style: {
            id: enhancement.styleId,
            name: enhancement.styleName,
            category: enhancement.category,
            source: enhancement.source,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
