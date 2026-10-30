import { Router } from "express";
import { Generation } from "../models/Generation.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const items = await Generation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ history: items.map((item) => item.toClient()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load history.";
    return res.status(500).json({ message });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required." });
    }

    const outputType = body.outputType === "image" ? "image" : "video";
    const imageDataUrl =
      typeof body.imageDataUrl === "string" && body.imageDataUrl.startsWith("data:")
        ? body.imageDataUrl
        : null;

    // Avoid oversized Mongo documents — keep a lighter thumb for list views when huge
    let thumb = typeof body.thumb === "string" ? body.thumb : imageDataUrl;
    const MAX_INLINE = 4_500_000; // ~4.5MB
    let storedImage = imageDataUrl;
    if (storedImage && storedImage.length > MAX_INLINE) {
      storedImage = null;
      if (thumb && thumb.length > MAX_INLINE) thumb = null;
    }

    const doc = await Generation.create({
      userId: req.user._id,
      prompt,
      path: body.path === "remotion" ? "remotion" : body.path === "ref" ? "ref" : "api",
      contentType: String(body.contentType || ""),
      outputType,
      genModel: String(body.genModel || ""),
      genModelLabel: String(body.genModelLabel || "VidCraft"),
      imageDataUrl: storedImage,
      thumb,
      cost: Number(body.cost) || 0,
      meta: body.meta || null,
    });

    return res.status(201).json({ entry: doc.toClient() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save history.";
    return res.status(500).json({ message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Generation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Generation not found." });
    }
    return res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete.";
    return res.status(500).json({ message });
  }
});

export default router;
