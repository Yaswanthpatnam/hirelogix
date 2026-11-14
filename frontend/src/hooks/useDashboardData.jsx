import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getJobSummary,
  getJobs,
} from "../services/jobs";

import {
  getGmailConnectionStatus,
  syncHistoricalGmail,
  syncIncrementalGmail,
} from "../services/gmail";


function normalizeJobs(
  jobsData
) {
  if (
    Array.isArray(jobsData)
  ) {
    return jobsData;
  }

  for (
    const key of [
      "results",
      "jobs",
      "data",
    ]
  ) {
    if (
      Array.isArray(
        jobsData?.[key]
      )
    ) {
      return jobsData[key];
    }
  }

  return [];
}


function normalizeSummary(
  summaryData
) {
  if (!summaryData) {
    return null;
  }

  for (
    const key of [
      "results",
      "data",
      "summary",
    ]
  ) {
    if (
      summaryData?.[key] &&
      typeof summaryData[key] === "object" &&
      !Array.isArray(summaryData[key])
    ) {
      return summaryData[key];
    }
  }

  return summaryData;
}


export default function useDashboardData() {
  const [
    summary,
    setSummary,
  ] = useState(null);

  const [
    jobs,
    setJobs,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    isSyncing,
    setIsSyncing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    gmailConnection,
    setGmailConnection,
  ] = useState(null);

  const isSyncingRef = useRef(false);
  const pollTimerRef = useRef(null);

  const fetchLatestData = useCallback(async () => {
    try {
      const [summaryData, jobsData] = await Promise.all([
        getJobSummary(),
        getJobs({ page: 1 }),
      ]);
      setSummary(normalizeSummary(summaryData));
      setJobs(normalizeJobs(jobsData));
    } catch (_) {}
  }, []);

  const runAutoSync = useCallback(async (connectionOverride = null) => {
    if (isSyncingRef.current) return;

    try {
      const status = connectionOverride || await getGmailConnectionStatus();
      setGmailConnection(status);

      if (!status?.connected || status?.needs_reconnect) {
        return;
      }

      isSyncingRef.current = true;
      setIsSyncing(true);

      // Start live polling while AI model processes applications in background
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(() => {
        fetchLatestData();
      }, 4500);

      if (!status.historical_sync_completed) {
        await syncHistoricalGmail().catch(() => {});
      } else {
        await syncIncrementalGmail().catch(() => {});
      }
    } catch (err) {
      console.warn("Background auto-sync note:", err);
    } finally {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      // One final fetch to ensure all newly created/updated applications are reflected
      await fetchLatestData();
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [fetchLatestData]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, jobsData] = await Promise.all([
        getJobSummary(),
        getJobs({ page: 1 }),
      ]);

      setSummary(normalizeSummary(summaryData));
      setJobs(normalizeJobs(jobsData));
      setLoading(false);

      // Check Gmail connection and trigger background sync
      try {
        const gmailStatus = await getGmailConnectionStatus();
        setGmailConnection(gmailStatus);

        if (gmailStatus?.connected && !gmailStatus?.needs_reconnect) {
          runAutoSync(gmailStatus);
        }
      } catch (_) {
        // Ignore connection check error
      }

      return true;
    } catch (err) {
      console.error("Dashboard data failed:", err);
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Unable to load your job search data."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [runAutoSync]);

  const refresh = useCallback(async () => {
    return runAutoSync();
  }, [runAutoSync]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Automatic incremental sync when user switches back to tab or focuses window
  useEffect(() => {
    const handleFocus = () => {
      if (!isSyncingRef.current) {
        runAutoSync();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [runAutoSync]);

  const updateLocalJob = useCallback((updatedJob) => {
    if (!updatedJob?.id) return;

    setJobs((prevJobs) =>
      prevJobs.map((j) =>
        j.id === updatedJob.id ? { ...j, ...updatedJob } : j
      )
    );

    getJobSummary()
      .then((summaryData) => {
        setSummary(normalizeSummary(summaryData));
      })
      .catch((err) => {
        console.error("Summary refresh failed:", err);
      });
  }, []);

  return {
    summary,
    jobs,
    loading,
    isSyncing,
    error,
    gmailConnection,
    refresh,
    updateLocalJob,
  };
}
