import {
  Bell,
  ChevronRight,
  Menu,
  Zap,
} from "lucide-react";


export default function Topbar({
  activeNav,
  hasApplications,
  isSyncing,
  onMenu,
  onSync,
  syncText,
}) {
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

        <div className="gmail-status">

          <span
            className={
              isSyncing
                ? "status-live permission-spin"
                : hasApplications
                ? "status-live"
                : "status-off"
            }
          />

          <span>
            {
              isSyncing
                ? "Syncing with Gemini..."
                : hasApplications
                ? "Job data loaded"
                : "No applications"
            }
          </span>

        </div>


        <button
          className="sync-button"
          onClick={onSync}
          disabled={isSyncing}
        >

          <Zap size={13} className={isSyncing ? "permission-spin" : ""} />

          {isSyncing ? "Syncing..." : syncText}

        </button>


        <button
          className="icon-button"
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>

      </div>

    </header>
  );
}