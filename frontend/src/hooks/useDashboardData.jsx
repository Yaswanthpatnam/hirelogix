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
  syncIncrementalGmail,
} from "../services/gmail";


function normalizeJobs(
  jobsData
) {

  if (
    Array.isArray(
      jobsData
    )
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

      return jobsData[
        key
      ];

    }

  }


  return [];

}


function normalizeSummary(
  summaryData
) {

  if (
    !summaryData
  ) {

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
      summaryData?.[
        key
      ] &&
      typeof summaryData[
        key
      ] === "object" &&
      !Array.isArray(
        summaryData[
          key
        ]
      )
    ) {

      return summaryData[
        key
      ];

    }

  }


  return summaryData;

}


export default function useDashboardData() {

  const [
    summary,
    setSummary,
  ] =
    useState(
      null
    );


  const [
    jobs,
    setJobs,
  ] =
    useState(
      []
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const loadDashboardData =
    useCallback(
      async () => {

        try {

          setLoading(
            true
          );

          setError(
            ""
          );


          const [
            summaryData,
            jobsData,
          ] =
            await Promise.all([
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

        } catch (
          err
        ) {

          console.error(
            "Dashboard data failed:",
            err
          );


          setError(
            err?.response?.data?.detail ||
            "Unable to load your job search data."
          );


          return false;

        } finally {

          setLoading(
            false
          );

        }

      },
      []
    );


  const refresh =
    useCallback(
      async () => {

        try {

          setLoading(
            true
          );

          setError(
            ""
          );


          /*
           * STEP 1
           *
           * Ask Gmail to check messages that
           * arrived after the previous history
           * checkpoint.
           */

          await syncIncrementalGmail();


          /*
           * STEP 2
           *
           * Gmail sync has finished.
           * Reload the database data so the
           * dashboard reflects new applications.
           */

          const [
            summaryData,
            jobsData,
          ] =
            await Promise.all([
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

        } catch (
          err
        ) {

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

          setLoading(
            false
          );

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


  return {
    summary,
    jobs,
    loading,
    error,
    refresh,
  };

}