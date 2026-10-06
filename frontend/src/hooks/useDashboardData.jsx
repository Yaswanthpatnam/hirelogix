import {
  useCallback,
  useEffect,
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


  const loadDashboardData =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          let [
            summaryData,
            jobsData,
          ] = await Promise.all([
            getJobSummary(),
            getJobs({
              page: 1,
            }),
          ]);

          let normSummary = normalizeSummary(summaryData);
          let normJobs = normalizeJobs(jobsData);
          setSummary(normSummary);
          setJobs(normJobs);
          setLoading(false);

          // If historical sync is not yet complete, trigger a background pass
          try {
            const gmailStatus = await getGmailConnectionStatus();
            if (gmailStatus?.connected) {
              if (!gmailStatus?.historical_sync_completed) {
                // Background single pass to make progress without blocking UI
                syncHistoricalGmail().then(() => {
                  Promise.all([getJobSummary(), getJobs({ page: 1 })]).then(([s, j]) => {
                    setSummary(normalizeSummary(s));
                    setJobs(normalizeJobs(j));
                  });
                }).catch(() => {});
              } else {
                // Quick incremental check in background
                syncIncrementalGmail().then(() => {
                  Promise.all([getJobSummary(), getJobs({ page: 1 })]).then(([s, j]) => {
                    setSummary(normalizeSummary(s));
                    setJobs(normalizeJobs(j));
                  });
                }).catch(() => {});
              }
            }
          } catch (_) {
            // Ignore connection check error
          }

          return true;

        } catch (err) {
          console.error(
            "Dashboard data failed:",
            err
          );

          setError(
            err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "Unable to load your job search data."
          );

          return false;

        } finally {
          setLoading(false);
        }
      },
      []
    );


  const refresh =
    useCallback(
      async () => {
        try {
          setIsSyncing(true);
          setError("");

          const gmailStatus =
            await getGmailConnectionStatus();

          if (gmailStatus?.connected) {
            try {
              // Always run sub-second incremental delta sync on refresh
              await syncIncrementalGmail();
            } catch (syncErr) {
              console.warn("Incremental sync note during refresh:", syncErr);
              // If incremental returned error (e.g. historical in progress), try single historical step
              try {
                await syncHistoricalGmail();
              } catch (_) {}
            }
          }

          const [
            summaryData,
            jobsData,
          ] = await Promise.all([
            getJobSummary(),
            getJobs({
              page: 1,
            }),
          ]);

          setSummary(
            normalizeSummary(
              summaryData
            )
          );

          setJobs(
            normalizeJobs(
              jobsData
            )
          );

          return true;

        } catch (err) {
          console.error(
            "Dashboard refresh failed:",
            err
          );

          setError(
            err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Unable to refresh Gmail job data."
          );

          return false;

        } finally {
          setIsSyncing(false);
          setLoading(false);
        }
      },
      []
    );


  useEffect(
    () => {
      loadDashboardData();
    },
    [
      loadDashboardData,
    ]
  );


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
    refresh,
    updateLocalJob,
  };
}
