export const SettingsView = ({ apiKeys, setApiKeys, budget, setBudget }) => {
  return (
    <div className="vc-settings">
      <div>
        <h1 className="vc-page-title">Settings</h1>
        <p className="vc-page-sub">Manage API keys and your session budget.</p>
      </div>

      <div className="vc-card">
        <div className="vc-card-title">API keys</div>
        <div className="vc-field">
          <label className="vc-label" htmlFor="openai-key">
            OpenAI
          </label>
          <input
            id="openai-key"
            className="vc-input"
            type="password"
            placeholder="sk-proj-..."
            value={apiKeys.openai}
            onChange={(event) =>
              setApiKeys((prev) => ({
                ...prev,
                openai: event.target.value,
              }))
            }
          />
        </div>
        <div className="vc-field">
          <label className="vc-label" htmlFor="wavespeed-key">
            Qwen Cloud (Remotion Engine)
          </label>
          <input
            id="wavespeed-key"
            className="vc-input"
            type="password"
            placeholder="API key from home.qwencloud.com/api-keys"
            value={apiKeys.wavespeed}
            onChange={(event) =>
              setApiKeys((prev) => ({
                ...prev,
                wavespeed: event.target.value,
              }))
            }
          />
        </div>
        <div className="vc-field">
          <label className="vc-label" htmlFor="cloudinary-key">
            Cloudinary
          </label>
          <input
            id="cloudinary-key"
            className="vc-input"
            type="password"
            placeholder="cloudinary://..."
            value={apiKeys.cloudinary}
            onChange={(event) =>
              setApiKeys((prev) => ({
                ...prev,
                cloudinary: event.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="vc-card">
        <div className="vc-card-title">Session budget</div>
        <div className="vc-field">
          <label className="vc-label" htmlFor="budget">
            Limit (INR)
          </label>
          <input
            id="budget"
            className="vc-input"
            type="number"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
