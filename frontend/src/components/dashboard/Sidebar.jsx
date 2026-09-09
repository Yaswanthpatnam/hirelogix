import {
  BriefcaseBusiness,
  Clock3,
  Gauge,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  X,
} from "lucide-react";

import {
  getInitials,
  getUserDisplayName,
} from "../../utils/dashboardHelpers";


const navItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    label: "Applications",
    icon: BriefcaseBusiness,
  },
  {
    label: "Timeline",
    icon: Clock3,
  },
  {
    label: "Insights",
    icon: Gauge,
  },
];


export default function Sidebar({
  active,
  onNavigate,
  onClose,
  totalApplications,
  user,
}) {
  const displayName =
    getUserDisplayName(user);

  const email =
    user?.email ||
    "Signed in";


  const logout =
    () => {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      localStorage.removeItem("is_new_user");

      window.location.assign("/");
    };


  return (
    <aside className="sidebar">

      <div className="sidebar-top">

        <div className="dash-logo">

          <span>
            H
          </span>

          <div>
            <strong>
              HireLogix
            </strong>

            <small>
              THE CALMER WAY TO JOB HUNT
            </small>
          </div>

        </div>


        <button
          className="icon-button mobile-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

      </div>


      <nav
        className="sidebar-nav"
        aria-label="Main navigation"
      >

        {
          navItems.map(
            ({
              label,
              icon: Icon,
            }) => (
              <button
                key={label}
                className={
                  active === label
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={
                  () =>
                    onNavigate(label)
                }
              >
                <Icon size={17} />

                <span>
                  {label}
                </span>

                {
                  label === "Applications" && (
                    <em>
                      {totalApplications}
                    </em>
                  )
                }

              </button>
            )
          )
        }

      </nav>


      <div className="sidebar-bottom">

        <div className="profile-card">

          <div className="avatar">
            {getInitials(displayName)}
          </div>

          <div className="profile-copy">
            <strong>
              {displayName}
            </strong>

            <span>
              {email}
            </span>
          </div>

          <MoreHorizontal size={16} />

        </div>


        <button
          className="logout-button"
          onClick={logout}
        >
          <LogOut size={16} />

          Log out
        </button>

      </div>

    </aside>
  );
}
