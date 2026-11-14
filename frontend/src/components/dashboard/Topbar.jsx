import {
  ChevronRight,
  Menu,
  Sparkles,
} from "lucide-react";


export default function Topbar({
  activeNav,
  hasApplications,
  isSyncing,
  gmailConnection,
  onMenu,
  onReconnect,
}) {
  const isConnected = Boolean(gmailConnection?.connected);
  const needsReconnect = Boolean(gmailConnection?.needs_reconnect);

  return (
    <header className="topbar">

      <button
        className="icon-button menu-button"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>


      <div className="breadcrumb">

        <span>
          Workspace
        </span>

        <ChevronRight
          size={14}
        />

        <strong>
          {activeNav}
        </strong>

      </div>


      <div className="topbar-actions">

        {/* Live background AI processing indicator */}
        {isSyncing && (
          <div className="ai-processing-pill">
            <Sparkles size={13} className="ai-sparkle-spin" />
            <span>AI model analyzing emails...</span>
          </div>
        )}

        {/* Real-time Gmail connection status */}
        <div className="gmail-status">

          <span
            className={
              needsReconnect
                ? "status-off"
                : isConnected
                ? "status-live"
                : "status-off"
            }
            style={
              needsReconnect
                ? { background: "#ff6b6b", boxShadow: "0 0 10px rgba(255,107,107,0.5)" }
                : {}
            }
          />

          <span>
            {
              needsReconnect
                ? "Gmail session expired"
                : isConnected
                ? "Gmail connected"
                : "Gmail not connected"
            }
          </span>

        </div>

        {/* Only show reconnect action if authentication was revoked / expired */}
        {needsReconnect && onReconnect && (
          <button
            className="sync-button"
            onClick={onReconnect}
            style={{ borderColor: "#ff6b6b", color: "#ff6b6b" }}
          >
            Reconnect Gmail
          </button>
        )}

      </div>

    </header>
  );
}