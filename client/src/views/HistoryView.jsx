import { Image as ImageIcon, LogIn, Trash2, Video } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export const HistoryView = ({ history, loading, onDelete, onRequireAuth }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="vc-history">
        <h1 className="vc-page-title">History</h1>
        <p className="vc-page-sub">Sign in to see generations saved to your account.</p>
        <div className="vc-empty vc-empty-action">
          <p>Your personal history is locked until you sign in.</p>
          <button className="vc-btn-signup" type="button" onClick={onRequireAuth}>
            <LogIn size={14} strokeWidth={1.8} />
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="vc-history">
        <h1 className="vc-page-title">History</h1>
        <p className="vc-page-sub">Loading your generations…</p>
        <div className="vc-empty">Fetching history…</div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="vc-history">
        <h1 className="vc-page-title">History</h1>
        <p className="vc-page-sub">Your recent generations will show up here.</p>
        <div className="vc-empty">No history yet. Generate something in the studio.</div>
      </div>
    );
  }

  return (
    <div className="vc-history">
      <h1 className="vc-page-title">History</h1>
      <p className="vc-page-sub">Your generations across image and video.</p>
      <div className="vc-history-list">
        {history.map((entry) => {
          const thumb = entry.imageDataUrl || entry.thumb;
          return (
            <div key={entry.id} className="vc-history-item">
              <div className="vc-history-left">
                {thumb ? (
                  <div className="vc-history-thumb-wrap">
                    <img className="vc-history-thumb" src={thumb} alt="" />
                  </div>
                ) : (
                  <div className="vc-history-icon">
                    {entry.outputType === "image" ? (
                      <ImageIcon size={18} strokeWidth={1.6} />
                    ) : (
                      <Video size={18} strokeWidth={1.6} />
                    )}
                  </div>
                )}
                <div>
                  <div className="vc-history-title">{entry.prompt || "Untitled prompt"}</div>
                  <div className="vc-history-sub">
                    {entry.timestamp} · {entry.outputType} ·{" "}
                    {entry.path === "remotion"
                      ? "Remotion"
                      : entry.path === "ref"
                        ? "Ref"
                        : "Studio"}
                    {entry.genModelLabel ? ` · ${entry.genModelLabel}` : ""}
                  </div>
                </div>
              </div>
              <div className="vc-history-right">
                <div className="vc-history-cost">
                  {entry.cost ? `₹${entry.cost}` : "Free"}
                </div>
                {onDelete && (
                  <button
                    className="vc-history-delete"
                    type="button"
                    aria-label="Delete generation"
                    onClick={() => onDelete(entry.id)}
                  >
                    <Trash2 size={14} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
