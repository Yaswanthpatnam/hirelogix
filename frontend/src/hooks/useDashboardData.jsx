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

          // If historical sync is not yet complete, finish remaining pages in background
          try {
            const gmailStatus = await getGmailConnectionStatus();
            if (gmailStatus?.connected && !gmailStatus?.historical_sync_completed) {
              (async () => {
                try {
                  setIsSyncing(true);
                  let hasMore = true;
                  let loops = 0;
                  while (hasMore && loops < 5) {
                    const syncRes = await syncHistoricalGmail();
                    hasMore = Boolean(syncRes?.has_more);
                    loops++;

                    // Progressive update as applications are parsed
                    const [midSummary, midJobs] = await Promise.all([
                      getJobSummary(),
                      getJobs({ page: 1 }),
                    ]);
                    setSummary(normalizeSummary(midSummary));
                    setJobs(normalizeJobs(midJobs));
                  }
                } catch (_) {
                  // Ignore background sync errors
                } finally {
                  setIsSyncing(false);
                }
              })();
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
              if (!gmailStatus?.historical_sync_completed) {
                await syncHistoricalGmail();
              } else {
                await syncIncrementalGmail();
              }
            } catch (syncErr) {
              console.warn("Background sync warning during refresh:", syncErr);
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
