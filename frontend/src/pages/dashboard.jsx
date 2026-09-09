import {
  useEffect,
  useState,
} from "react";

import "../styles/dashboard.css";

import Sidebar from
  "../components/dashboard/Sidebar";

import Topbar from
  "../components/dashboard/Topbar";

import DashboardSkeleton from
  "../components/dashboard/DashboardSkeleton";

import DetailPanel from
  "../components/dashboard/DetailPanel";

import Overview from
  "../components/views/Overview";

import ApplicationsView from
  "../components/views/ApplicationsView";

import TimelineView from
  "../components/views/TimelineView";

import InsightsView from
  "../components/views/InsightsView";

import EmptyDashboard from
  "../components/views/EmptyDashboard";

import useDashboardData from
  "../hooks/useDashboardData";

import {
  getStoredUser,
} from "../utils/dashboardHelpers";


const DASHBOARD_VIEWS = [
  "Overview",
  "Applications",
  "Timeline",
  "Insights",
];


export default function Dashboard() {

  const [
    activeNav,
    setActiveNav,
  ] =
    useState(
      () => {

        const state =
          window.history.state;

        if (
          state?.hirelogixDashboard &&
          DASHBOARD_VIEWS.includes(
            state.view
          )
        ) {

          return state.view;

        }

        return "Overview";

      }
    );


  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(
      false
    );


  const [
    selectedJobId,
    setSelectedJobId,
  ] =
    useState(
      null
    );


  const [
    syncText,
    setSyncText,
  ] =
    useState(
      "Refresh"
    );


  const user =
    getStoredUser();


  const {
    summary,
    jobs,
    loading,
    error,
    refresh,
  } =
    useDashboardData();


  const safeJobs =
    Array.isArray(
      jobs
    )
      ? jobs
      : [];


  const totalApplications =
    Number(
      summary?.total ??
      safeJobs.length ??
      0
    );


  const hasApplications =
    totalApplications > 0;


  /*
    Register the current browser history entry
    as the Dashboard Overview.

    IMPORTANT:

    We use replaceState.

    We DO NOT push another history entry.

    Therefore:

    Previous Page
        ↓
    Overview
        ↓
    Insights

    Back from Insights returns to Overview.
    Back from Overview returns to Previous Page.
  */

  useEffect(
    () => {

      const currentState =
        window.history.state;


      if (
        !currentState?.hirelogixDashboard
      ) {

        window.history.replaceState(
          {
            ...currentState,

            hirelogixDashboard:
              true,

            view:
              "Overview",
          },
          "",
          window.location.href
        );

      }


      const handlePopState =
        (event) => {

          const state =
            event.state;


          /*
            Browser Back/Forward between
            Dashboard internal views.
          */

          if (
            state?.hirelogixDashboard &&
            DASHBOARD_VIEWS.includes(
              state.view
            )
          ) {

            setActiveNav(
              state.view
            );


            setSelectedJobId(
              null
            );


            setMobileOpen(
              false
            );


            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

          }

        };


      window.addEventListener(
        "popstate",
        handlePopState
      );


      return () => {

        window.removeEventListener(
          "popstate",
          handlePopState
        );

      };

    },
    []
  );


  const handleNavigation =
    (item) => {

      if (
        !DASHBOARD_VIEWS.includes(
          item
        )
      ) {

        return;

      }


      if (
        item === activeNav
      ) {

        setMobileOpen(
          false
        );

        return;

      }


      /*
        This creates a REAL browser
        history entry.

        Example:

        Previous Page
        → Overview
        → Insights

        Browser Back:

        Insights
        → Overview
      */

      window.history.pushState(
        {
          hirelogixDashboard:
            true,

          view:
            item,
        },
        "",
        window.location.href
      );


      setActiveNav(
        item
      );


      setSelectedJobId(
        null
      );


      setMobileOpen(
        false
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };


  const handleSync =
    async () => {

      setSyncText(
        "Refreshing..."
      );


      try {

        const result =
          await refresh();


        setSyncText(
          result === false
            ? "Try again"
            : "Refreshed"
        );

      } catch {

        setSyncText(
          "Try again"
        );

      } finally {

        window.setTimeout(
          () => {

            setSyncText(
              "Refresh"
            );

          },
          1500
        );

      }

    };


  const navigateTo =
    (view) =>
      () =>
        handleNavigation(
          view
        );


  const renderContent =
    () => {

      if (
        loading
      ) {

        return (
          <DashboardSkeleton />
        );

      }


      if (
        error
      ) {

        return (

          <div className="hl-dashboard-error">

            <h2>
              Unable to load dashboard
            </h2>

            <p>
              {error}
            </p>

            <button
              className="hl-primary-action"
              onClick={refresh}
            >
              Try again
            </button>

          </div>

        );

      }


      switch (
        activeNav
      ) {

        case "Applications":

          return (

            <ApplicationsView
              initialJobs={
                safeJobs
              }
              onSelect={
                setSelectedJobId
              }
            />

          );


        case "Timeline":

          return (

            <TimelineView
              jobs={
                safeJobs
              }
              onSelect={
                setSelectedJobId
              }
            />

          );


        case "Insights":

          return (

            <InsightsView
              summary={
                summary
              }
              jobs={
                safeJobs
              }
            />

          );


        case "Overview":

        default:

          if (
            !hasApplications
          ) {

            return (

              <EmptyDashboard
                onApplications={
                  navigateTo(
                    "Applications"
                  )
                }
              />

            );

          }


          return (

            <Overview
              summary={
                summary
              }
              jobs={
                safeJobs
              }
              user={
                user
              }
              onSelect={
                setSelectedJobId
              }
              onApplications={
                navigateTo(
                  "Applications"
                )
              }
              onTimeline={
                navigateTo(
                  "Timeline"
                )
              }
              onInsights={
                navigateTo(
                  "Insights"
                )
              }
            />

          );

      }

    };


  return (

    <div className="dashboard-shell">

      <div
        className={
          `sidebar-wrap ${
            mobileOpen
              ? "open"
              : ""
          }`
        }
      >

        <Sidebar
          active={
            activeNav
          }
          onNavigate={
            handleNavigation
          }
          onClose={
            () =>
              setMobileOpen(
                false
              )
          }
          totalApplications={
            totalApplications
          }
          user={
            user
          }
        />

      </div>


      <div className="dashboard-main">

        <Topbar
          activeNav={
            activeNav
          }
          hasApplications={
            hasApplications
          }
          onMenu={
            () =>
              setMobileOpen(
                true
              )
          }
          onSync={
            handleSync
          }
          syncText={
            syncText
          }
        />

        <main className="dashboard-content">

          {
            renderContent()
          }

        </main>

      </div>


      {
        selectedJobId && (

          <DetailPanel
            jobId={
              selectedJobId
            }
            onClose={
              () =>
                setSelectedJobId(
                  null
                )
            }
          />

        )
      }

    </div>

  );

}