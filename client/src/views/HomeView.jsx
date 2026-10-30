import {
  Clapperboard,
  Film,
  ImagePlus,
  Layers,
  LayoutGrid,
  Smartphone,
  Sparkles,
  Wand2,
} from "lucide-react";
import { FEATURED, TOOL_CARDS } from "../config/vidcraft";

const ICONS = {
  banana: Wand2,
  film: Film,
  sparkles: Sparkles,
  clapper: Clapperboard,
  smartphone: Smartphone,
  layers: Layers,
  imagePlus: ImagePlus,
};

export const HomeView = ({
  templates,
  onPrimaryAction,
  onTemplateUse,
  onNavigateStudio,
  onNavigateRef,
}) => {
  const handleFeatured = (card) => {
    if (card.action === "image") onPrimaryAction("image");
    else if (card.action === "studio") onNavigateStudio?.();
    else if (card.action === "home") return;
    else onPrimaryAction("image");
  };

  const handleTool = (tool) => {
    if (tool.mediaType === "ref") {
      onNavigateRef?.();
      return;
    }
    onPrimaryAction(tool.mediaType || "image");
  };

  return (
    <div className="vc-home">
      <div className="vc-featured">
        {FEATURED.map((card) => (
          <button
            key={card.id}
            className={`vc-feat-card${card.tone === "light" ? " is-light" : ""}`}
            onClick={() => handleFeatured(card)}
          >
            <div className="vc-feat-media">
              {card.tone === "light" ? (
                <div className="vc-feat-mock">
                  <div className="vc-feat-mock-bar">
                    <Sparkles size={14} strokeWidth={1.6} />
                    <span>{card.promptPreview}</span>
                  </div>
                </div>
              ) : (
                <>
                  <img src={card.image} alt={card.title} loading="lazy" />
                  {card.overlay && <div className="vc-feat-overlay">{card.overlay}</div>}
                </>
              )}
            </div>
            <div className="vc-feat-meta">
              <div className="vc-feat-title">{card.title}</div>
              <div className="vc-feat-sub">{card.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="vc-explore-lower">
        <button className="vc-promo-card" onClick={() => onPrimaryAction("image")}>
          <div className="vc-promo-bg">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80"
              alt=""
              loading="lazy"
            />
          </div>
          <span className="vc-promo-tag">EXTRA DISCOUNT</span>
          <div className="vc-promo-content">
            <div className="vc-promo-title">Sign up and get your extra discount</div>
            <span className="vc-promo-cta">Sign up and get your discount</span>
          </div>
        </button>

        <div className="vc-tool-grid">
          {TOOL_CARDS.map((tool, index) => {
            const Icon = ICONS[tool.icon] || Sparkles;
            return (
              <button
                key={tool.id}
                className="vc-tool-card"
                style={{ animationDelay: `${0.08 + index * 0.04}s` }}
                onClick={() => handleTool(tool)}
              >
                <div className="vc-tool-top">
                  <span className="vc-tool-icon">
                    <Icon size={16} strokeWidth={1.7} />
                  </span>
                  <span className={`vc-badge is-${tool.badgeTone}`}>{tool.badge}</span>
                </div>
                <div>
                  <div className="vc-tool-title">{tool.title}</div>
                  <div className="vc-tool-desc">{tool.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="vc-section-head">
        <div className="vc-section-title">
          <LayoutGrid size={14} strokeWidth={1.6} />
          <span>Templates</span>
        </div>
      </div>

      <div className="vc-template-grid">
        {templates.map((template, index) => (
          <button
            key={template.id}
            className="vc-template-card"
            onClick={() => onTemplateUse(template)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="vc-template-thumb">
              <img src={template.image} alt={template.label} loading="lazy" />
            </div>
            <div className="vc-template-body">
              <div className="vc-template-top">
                <span className="vc-template-title">{template.label}</span>
                <span className="vc-template-pill">
                  {template.mediaType === "image" ? "Image" : "Video"}
                </span>
              </div>
              <div className="vc-template-sub">{template.contentType}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
