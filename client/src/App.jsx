import { useEffect, useRef, useState } from "react";
import "./styles/vidcraft.css";
import { GEN_MODELS, INITIAL_HISTORY, TEMPLATES } from "./config/vidcraft";
import { generateFromRef, generateRemotionPlan, generateVideo } from "./api/promptApi";
import { deleteHistoryEntry, fetchHistory } from "./api/historyApi";
import { Header } from "./components/Header";
import { HomeView } from "./views/HomeView";
import { StudioView } from "./views/StudioView";
import { RefStudioView } from "./views/RefStudioView";
import { HistoryView } from "./views/HistoryView";
import { SettingsView } from "./views/SettingsView";
import { AuthView } from "./views/AuthView";
import { resolveImageSize } from "./utils/imageSize";
import { useAuth } from "./auth/AuthContext";

const EMPTY_PROMPTS = {
  image: "",
  video: "",
  remotion: "",
  ref: "",
};

const EMPTY_JOB = {
  image: { generating: false, pct: 0, error: "" },
  video: { generating: false, pct: 0, error: "" },
  remotion: { generating: false, pct: 0, error: "" },
  ref: { generating: false, pct: 0, error: "" },
};

const pickDefaultModel = (mediaType, tier) => {
  if (mediaType === "image") {
    return (
      GEN_MODELS.find((model) => model.mediaType === "image" && model.selectable !== false)?.id ||
      "vidcraft"
    );
  }
  return (
    GEN_MODELS.find(
      (model) =>
        model.mediaType === mediaType &&
        model.selectable !== false &&
        (!tier || model.tier === tier)
    )?.id ||
    GEN_MODELS.find((model) => model.mediaType === mediaType && model.selectable !== false)?.id ||
    GEN_MODELS.find((model) => model.mediaType === mediaType)?.id ||
    ""
  );
};

const resolveStudioKey = (mediaType, path) => {
  if (path === "remotion" && mediaType === "video") return "remotion";
  if (path === "ref" && mediaType === "image") return "ref";
  if (mediaType === "image") return "image";
  return "video";
};

export default function App() {
  const { isAuthenticated, token, booting, logout } = useAuth();
  const [tab, setTab] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [prompts, setPrompts] = useState(EMPTY_PROMPTS);
  const [path, setPath] = useState("remotion");
  const [ctType, setCtType] = useState("animated");
  const [tier, setTier] = useState("wavespeed");
  const [mediaType, setMediaType] = useState("video");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [genModel, setGenModel] = useState(() => pickDefaultModel("video", "wavespeed"));
  const [resolution, setResolution] = useState("2K");
  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [batchSize, setBatchSize] = useState(1);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [jobs, setJobs] = useState(EMPTY_JOB);
  const [latestImage, setLatestImage] = useState(null);
  const [latestVideo, setLatestVideo] = useState(null);
  const [latestRefImage, setLatestRefImage] = useState(null);
  const [refImage, setRefImage] = useState(null);
  const [refStrength, setRefStrength] = useState(0.65);
  const [remotionPlan, setRemotionPlan] = useState(null);
  const [remotionGeneration, setRemotionGeneration] = useState(null);
  const [remotionWarning, setRemotionWarning] = useState("");
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState({ openai: "", wavespeed: "", cloudinary: "" });
  const [budget, setBudget] = useState("5000");

  const jobEpochRef = useRef({
    image: 0,
    video: 0,
    remotion: 0,
    ref: 0,
  });

  const studioKey = resolveStudioKey(mediaType, path);
  const prompt = prompts[studioKey] || "";
  const activeJob = jobs[studioKey] || EMPTY_JOB.image;
  const generating = activeJob.generating;
  const genPct = activeJob.pct;
  const genError = activeJob.error;

  const costPerSec = tier === "premium" ? 55 : tier === "wavespeed" ? 27.9 : 0;

  const setPromptForActive = (value) => {
    setPrompts((prev) => ({
      ...prev,
      [studioKey]: typeof value === "function" ? value(prev[studioKey] || "") : value,
    }));
  };

  const patchJob = (key, patch) => {
    setJobs((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const beginJob = (key) => {
    jobEpochRef.current[key] += 1;
    const epoch = jobEpochRef.current[key];
    patchJob(key, { generating: true, pct: 0, error: "" });
    return epoch;
  };

  const isJobCurrent = (key, epoch) => jobEpochRef.current[key] === epoch;

  const requireAuthForAction = (nextTab = "login") => {
    setAuthMode(nextTab === "signup" ? "signup" : "login");
    setTab(nextTab === "signup" ? "signup" : "login");
  };

  const navigate = (next) => {
    if (next === "history" && !isAuthenticated) {
      setTab("login");
      return;
    }
    setTab(next);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const items = await fetchHistory(token);
        if (!cancelled) setHistory(items);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (mediaType === "image") {
      const imageDefault = pickDefaultModel("image", tier);
      if (genModel !== imageDefault) setGenModel(imageDefault);
      return;
    }
    const nextModel = pickDefaultModel(mediaType, tier);
    if (nextModel && nextModel !== genModel) {
      const stillValid = GEN_MODELS.some(
        (model) => model.id === genModel && model.mediaType === mediaType
      );
      if (!stillValid) setGenModel(nextModel);
    }
  }, [mediaType, tier, genModel]);

  const handleMediaTypeChange = (nextType) => {
    setMediaType(nextType);
    if (nextType === "image") {
      setPath("api");
      setTier("wavespeed");
      setAspectRatio("3:4");
      if (ctType === "animated" || ctType === "narrative") {
        setCtType("photorealistic");
      }
    } else {
      setPath("api");
      setAspectRatio("16:9");
      if (ctType === "illustration" || ctType === "product") {
        setCtType("animated");
      }
    }
  };

  const handlePrimaryAction = (nextType) => {
    if (!isAuthenticated) {
      requireAuthForAction("signup");
      return;
    }
    handleMediaTypeChange(nextType);
    const key = nextType === "image" ? "image" : "video";
    setPrompts((prev) => ({ ...prev, [key]: "" }));
    setSelectedTemplate(null);
    if (nextType === "image") setLatestImage(null);
    patchJob(key, { error: "" });
    setTab("studio");
  };

  const handleMediaNavigate = (nextType) => {
    if (!isAuthenticated) {
      requireAuthForAction("login");
      return;
    }
    handleMediaTypeChange(nextType);
    setTab("studio");
  };

  const handleRefNavigate = () => {
    if (!isAuthenticated) {
      requireAuthForAction("login");
      return;
    }
    setMediaType("image");
    setPath("ref");
    setTier("wavespeed");
    setAspectRatio("3:4");
    patchJob("ref", { error: "" });
    setTab("studio");
  };

  const handleRemotionNavigate = () => {
    if (!isAuthenticated) {
      requireAuthForAction("login");
      return;
    }
    setMediaType("video");
    setPath("remotion");
    setTier("wavespeed");
    if (ctType === "illustration" || ctType === "product") {
      setCtType("animated");
    }
    setTab("studio");
  };

  const handleApplyTemplate = (template) => {
    if (!isAuthenticated) {
      requireAuthForAction("signup");
      return;
    }
    if (!template) return;
    if (template.mediaType) {
      handleMediaTypeChange(template.mediaType);
    }
    if (template.contentType) {
      setCtType(template.contentType);
    }
    let nextPath = path;
    if (template.recommendedPath && template.mediaType !== "image") {
      nextPath = template.recommendedPath;
      setPath(template.recommendedPath);
    }
    const key = resolveStudioKey(
      template.mediaType || mediaType,
      template.mediaType === "image" ? "api" : nextPath
    );
    setPrompts((prev) => ({ ...prev, [key]: template.prompt }));
    setSelectedTemplate(template);
    setTab("studio");
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
  };

  const prependHistory = (entry) => {
    if (!entry) return;
    setHistory((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)]);
  };

  const handleDeleteHistory = async (id) => {
    if (!token) return;
    try {
      await deleteHistoryEntry(token, id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      patchJob(studioKey, { error: error?.message || "Failed to delete history item." });
    }
  };

  const handleGenerate = () => {
    const jobKey = resolveStudioKey(mediaType, path);
    const jobPrompt = (prompts[jobKey] || "").trim();
    if (!jobPrompt) return;
    if (jobs[jobKey]?.generating) return;
    if (!isAuthenticated) {
      requireAuthForAction("login");
      return;
    }

    if (jobKey === "ref") {
      if (!refImage) {
        patchJob("ref", { error: "Upload a reference image first." });
        return;
      }

      const epoch = beginJob("ref");
      setLatestRefImage(null);

      const snap = {
        prompt: jobPrompt,
        refImage,
        strength: refStrength,
        resolution,
        aspectRatio,
        tier,
      };

      const steps = [8, 20, 36, 55, 72, 88, 96, 100];
      let i = 0;
      const interval = setInterval(() => {
        if (!isJobCurrent("ref", epoch)) {
          clearInterval(interval);
          return;
        }
        patchJob("ref", { pct: steps[i] });
        i += 1;
        if (i >= steps.length) {
          clearInterval(interval);
          setTimeout(async () => {
            if (!isJobCurrent("ref", epoch)) return;
            try {
              const size = resolveImageSize(snap.resolution, snap.aspectRatio);
              const result = await generateFromRef({
                prompt: snap.prompt,
                refImage: snap.refImage,
                strength: snap.strength,
                resolution: snap.resolution,
                aspectRatio: snap.aspectRatio,
                width: size?.width,
                height: size?.height,
                tier: snap.tier,
                contentType: "ref",
              });
              if (!isJobCurrent("ref", epoch)) return;
              patchJob("ref", { generating: false, pct: 0, error: "" });
              const imageDataUrl = result?.imageDataUrl || null;
              if (!imageDataUrl) {
                patchJob("ref", { error: "No image returned from VidCraft Ref." });
              }
              setLatestRefImage(imageDataUrl);
              if (result?.historyEntry) {
                prependHistory(result.historyEntry);
              } else {
                prependHistory({
                  id: String(Date.now()),
                  prompt: snap.prompt || "Untitled ref prompt",
                  path: "ref",
                  contentType: "ref",
                  outputType: "image",
                  genModel: "vidcraft-ref",
                  genModelLabel: "VidCraft Ref",
                  imageDataUrl,
                  cost: result?.cost ?? 0,
                  timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
                });
              }
            } catch (error) {
              if (!isJobCurrent("ref", epoch)) return;
              patchJob("ref", {
                generating: false,
                pct: 0,
                error: error?.message || "Ref image generation failed.",
              });
              setLatestRefImage(null);
              const message = error?.message || "";
              if (/sign in|unauthorized|401/i.test(message)) {
                logout();
                setTab("login");
              }
            }
          }, 350);
        }
      }, 480);
      return;
    }

    if (jobKey === "remotion") {
      const epoch = beginJob("remotion");
      setRemotionPlan(null);
      setRemotionGeneration(null);
      setRemotionWarning("");

      const snap = {
        prompt: jobPrompt,
        apiKey: apiKeys.wavespeed,
        contentType: ctType,
      };

      (async () => {
        try {
          if (!isJobCurrent("remotion", epoch)) return;
          patchJob("remotion", { pct: 12 });
          const result = await generateRemotionPlan({
            prompt: snap.prompt,
            apiKey: snap.apiKey,
            contentType: snap.contentType,
          });
          if (!isJobCurrent("remotion", epoch)) return;
          patchJob("remotion", { pct: 92 });
          setRemotionGeneration({
            id: result?.generationId || Date.now(),
            meta: result?.meta || null,
            source: result?.source || "qwen-codegen",
            mode: result?.mode || "codegen",
          });
          setRemotionPlan(null);
          setRemotionWarning(result?.warning || "");
          patchJob("remotion", { generating: false, pct: 0, error: "" });
          if (result?.historyEntry) {
            prependHistory(result.historyEntry);
          } else {
            prependHistory({
              id: String(Date.now()),
              prompt: snap.prompt || "Untitled remotion script",
              path: "remotion",
              contentType: snap.contentType,
              outputType: "video",
              genModel: result?.source || "qwen-codegen",
              genModelLabel: "VidCraft Remotion Engine",
              imageDataUrl: null,
              cost: 0,
              timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
            });
          }
        } catch (error) {
          if (!isJobCurrent("remotion", epoch)) return;
          setRemotionPlan(null);
          setRemotionGeneration(null);
          setRemotionWarning("");
          const message = error?.message || "Remotion generation failed.";
          patchJob("remotion", { generating: false, pct: 0, error: message });
          if (/sign in|unauthorized|401/i.test(message)) {
            logout();
            setTab("login");
          }
        }
      })();
      return;
    }

    // image or non-remotion video
    const epoch = beginJob(jobKey);
    if (jobKey === "image") setLatestImage(null);
    if (jobKey === "video") setLatestVideo(null);

    const snap = {
      jobKey,
      prompt: jobPrompt,
      path,
      tier,
      mediaType,
      genModel,
      ctType,
      selectedTemplateId: selectedTemplate?.id || null,
      resolution,
      aspectRatio,
      batchSize,
      costPerSec,
    };

    const steps = [6, 18, 34, 52, 68, 82, 92, 100];
    let i = 0;
    const interval = setInterval(() => {
      if (!isJobCurrent(jobKey, epoch)) {
        clearInterval(interval);
        return;
      }
      patchJob(jobKey, { pct: steps[i] });
      i += 1;
      if (i >= steps.length) {
        clearInterval(interval);
        setTimeout(async () => {
          if (!isJobCurrent(jobKey, epoch)) return;
          try {
            // Video is hard-capped to ~2s on the server (HF_VIDEO_SECONDS).
            const seconds = snap.mediaType === "image" ? 1 : 2;
            const size =
              snap.mediaType === "image"
                ? resolveImageSize(snap.resolution, snap.aspectRatio)
                : null;
            const result = await generateVideo({
              path: snap.path,
              tier: snap.tier,
              seconds,
              outputType: snap.mediaType,
              model: snap.genModel,
              contentType: snap.ctType,
              templateId: snap.selectedTemplateId,
              prompt: snap.prompt,
              resolution: snap.resolution,
              aspectRatio: snap.aspectRatio,
              batchSize: snap.batchSize,
              width: size?.width,
              height: size?.height,
            });
            if (!isJobCurrent(jobKey, epoch)) return;

            const modelMeta = GEN_MODELS.find((item) => item.id === snap.genModel);
            const unitCost = modelMeta?.costPerUnit ?? snap.costPerSec;
            const cost =
              snap.path === "remotion"
                ? 0
                : result?.cost ?? unitCost * (snap.mediaType === "image" ? 1 : seconds);

            patchJob(jobKey, { generating: false, pct: 0, error: "" });

            if (snap.mediaType === "image") {
              const imageDataUrl = result?.imageDataUrl || null;
              if (!imageDataUrl) {
                patchJob(jobKey, { error: "No image returned from the API." });
              }
              setLatestImage(imageDataUrl);
            }

            if (snap.mediaType === "video") {
              const videoDataUrl = result?.videoDataUrl || null;
              if (!videoDataUrl) {
                patchJob(jobKey, { error: "No video returned from the API." });
              }
              setLatestVideo(videoDataUrl);
            }

            if (result?.historyEntry) {
              prependHistory(result.historyEntry);
            } else if (snap.mediaType === "image" || snap.mediaType === "video") {
              prependHistory({
                id: String(Date.now()),
                prompt: snap.prompt || "Untitled prompt",
                path: snap.path,
                contentType: snap.ctType,
                outputType: snap.mediaType,
                genModel: snap.genModel,
                genModelLabel: result?.modelLabel || modelMeta?.label || "VidCraft",
                imageDataUrl: result?.imageDataUrl || null,
                videoDataUrl: result?.videoDataUrl || null,
                cost,
                timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
              });
            }
          } catch (error) {
            if (!isJobCurrent(jobKey, epoch)) return;
            const message =
              error?.message ||
              (snap.mediaType === "video" ? "Video generation failed." : "Image generation failed.");
            patchJob(jobKey, { generating: false, pct: 0, error: message });
            if (snap.mediaType === "image") setLatestImage(null);
            if (snap.mediaType === "video") setLatestVideo(null);
            if (/sign in|unauthorized|401/i.test(message)) {
              logout();
              setTab("login");
            }
          }
        }, 400);
      }
    }, 520);
  };

  if (booting) {
    return (
      <div className="vc">
        <div className="vc-bg" />
        <div className="vc-grid" />
        <div className="vc-boot">Loading VidCraft…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="vc vc-auth-root">
        <div className="vc-bg" />
        <AuthView
          mode={authMode === "signup" ? "signup" : "login"}
          onSwitchMode={() =>
            setAuthMode((prev) => (prev === "signup" ? "login" : "signup"))
          }
          onSuccess={() => {
            setAuthMode("login");
            setTab("home");
          }}
        />
      </div>
    );
  }

  return (
    <div className={`vc${bannerVisible ? "" : " no-banner"}`}>
      <div className="vc-bg" />
      <div className="vc-grid" />

      <div className="vc-main">
        <Header
          activeTab={tab}
          mediaType={mediaType}
          path={path}
          bannerVisible={bannerVisible}
          onDismissBanner={() => setBannerVisible(false)}
          onNavigate={navigate}
          onMediaNavigate={handleMediaNavigate}
          onRemotionNavigate={handleRemotionNavigate}
          onRefNavigate={handleRefNavigate}
        />
        <div className={`vc-body${tab === "studio" ? " is-studio" : ""}`}>
          {tab === "home" && (
            <HomeView
              templates={TEMPLATES}
              onPrimaryAction={handlePrimaryAction}
              onTemplateUse={handleApplyTemplate}
              onNavigateStudio={() => handlePrimaryAction("image")}
              onNavigateRef={handleRefNavigate}
            />
          )}
          {tab === "studio" && path === "ref" && mediaType === "image" && (
            <RefStudioView
              prompt={prompt}
              setPrompt={setPromptForActive}
              refImage={refImage}
              setRefImage={setRefImage}
              strength={refStrength}
              setStrength={setRefStrength}
              generating={generating}
              genPct={genPct}
              latestImage={latestRefImage}
              genError={genError}
              handleGenerate={handleGenerate}
              resolution={resolution}
              setResolution={setResolution}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
            />
          )}
          {tab === "studio" && !(path === "ref" && mediaType === "image") && (
            <StudioView
              prompt={prompt}
              setPrompt={setPromptForActive}
              mediaType={mediaType}
              path={path}
              generating={generating}
              genPct={genPct}
              latestImage={latestImage}
              latestVideo={latestVideo}
              remotionPlan={remotionPlan}
              remotionGeneration={remotionGeneration}
              remotionWarning={remotionWarning}
              genError={genError}
              handleGenerate={handleGenerate}
              selectedTemplate={selectedTemplate}
              onClearTemplate={handleClearTemplate}
              genModel={genModel}
              setGenModel={setGenModel}
              resolution={resolution}
              setResolution={setResolution}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              batchSize={batchSize}
              setBatchSize={setBatchSize}
            />
          )}
          {tab === "history" && (
            <HistoryView
              history={history}
              loading={historyLoading}
              onDelete={handleDeleteHistory}
              onRequireAuth={() => requireAuthForAction("login")}
            />
          )}
          {tab === "settings" && (
            <SettingsView
              apiKeys={apiKeys}
              setApiKeys={setApiKeys}
              budget={budget}
              setBudget={setBudget}
            />
          )}
        </div>
      </div>
    </div>
  );
}
