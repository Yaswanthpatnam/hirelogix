import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import {
  getJobs,
} from "../../services/jobs";

import SectionHeading from "../dashboard/SectionHeading";
import StatusBadge from "../dashboard/StatusBadge";

import {
  formatDate,
} from "../../utils/jobHelpers";

import {
  getCompanyColor,
  getInitials,
} from "../../utils/dashboardHelpers";


const STATUS_OPTIONS = [
  {
    value: "",
    label: "All applications",
  },
  {
    value: "applied",
    label: "Applied",
  },
  {
    value: "under_review",
    label: "Screening",
  },
  {
    value: "assessment",
    label: "Assessment",
  },
  {
    value: "interview",
    label: "Interview",
  },
  {
    value: "offer",
    label: "Offer",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];


function normalizeJobsResponse(
  response
) {
  if (
    Array.isArray(response)
  ) {
    return {
      jobs: response,
      count: response.length,
      next: null,
      previous: null,
    };
  }

  return {
    jobs:
      Array.isArray(
        response?.results
      )
        ? response.results
        : (
          Array.isArray(
            response?.jobs
          )
            ? response.jobs
            : []
        ),

    count:
      Number(
        response?.count ??
        response?.total ??
        0
      ),

    next:
      response?.next ?? null,

    previous:
      response?.previous ?? null,
  };
}


export default function ApplicationsView({
  initialJobs = [],
  onSelect,
}) {
  const [
    jobs,
    setJobs,
  ] =
    useState(
      Array.isArray(initialJobs)
        ? initialJobs
        : []
    );

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    status,
    setStatus,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(
      !Array.isArray(initialJobs) ||
      initialJobs.length === 0
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    reloadKey,
    setReloadKey,
  ] =
    useState(0);

  const [
    pagination,
    setPagination,
  ] =
    useState({
      count:
        Array.isArray(initialJobs)
          ? initialJobs.length
          : 0,
      next: null,
      previous: null,
    });


  const loadJobs =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getJobs({
              page,
              status,
              search,
            });

          const normalized =
            normalizeJobsResponse(
              response
            );

          setJobs(
            normalized.jobs
          );

          setPagination({
            count:
              normalized.count ||
              normalized.jobs.length,
            next:
              normalized.next,
            previous:
              normalized.previous,
          });
        } catch (
          err
        ) {
          console.error(
            "Applications failed:",
            err
          );

          setError(
            err?.response?.data?.detail ||
            "Unable to load applications."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        page,
        status,
        search,
      ]
    );


  useEffect(
    () => {
      const timeoutId =
        window.setTimeout(
          () => {
            setSearch(searchInput);
            setPage(1);
          },
          350
        );

      return () =>
        window.clearTimeout(
          timeoutId
        );
    },
    [
      searchInput,
    ]
  );


  useEffect(
    () => {
      loadJobs();
    },
    [
      loadJobs,
      reloadKey,
    ]
  );


  const handleStatusChange =
    (event) => {
      setStatus(
        event.target.value
      );

      setPage(1);
    };


  return (
    <section className="applications-view">

      <div className="dashboard-heading">

        <div>

          <p className="section-eyebrow">
            APPLICATION MANAGEMENT
          </p>

          <h1>
            Applications.
          </h1>

          <p>
            Search, filter and review every application in your job search.
          </p>

        </div>

      </div>


      <div className="applications-toolbar">

        <label className="application-search">

          <Search size={18} />

          <input
            value={searchInput}
            onChange={
              (event) =>
                setSearchInput(
                  event.target.value
                )
            }
            placeholder="Search company or role..."
          />

        </label>


        <select
          value={status}
          onChange={handleStatusChange}
          className="status-filter"
        >
          {
            STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )
          }
        </select>

      </div>


      <section className="panel applications-panel">

        <SectionHeading
          title="All applications"
          description={
            `${pagination.count} application${
              pagination.count === 1
                ? ""
                : "s"
            } found`
          }
        />


        {
          error && (
            <div className="dashboard-error">

              <p>
                {error}
              </p>

              <button
                className="hl-primary-action"
                onClick={
                  () =>
                    setReloadKey(
                      (value) =>
                        value + 1
                    )
                }
              >
                Try again
              </button>

            </div>
          )
        }


        {
          loading
            ? (
              <ApplicationsSkeleton />
            )
            : (
              <div className="application-list">

                <div className="application-list-head">
                  <span>Company</span>
                  <span>Role</span>
                  <span>Created</span>
                  <span>Status</span>
                  <span>Last update</span>
                </div>


                {
                  jobs.map(
                    (job) => (
                      <ApplicationRow
                        key={job.id}
                        job={job}
                        onClick={onSelect}
                      />
                    )
                  )
                }


                {
                  jobs.length === 0 && (
                    <div className="applications-empty">

                      <strong>
                        No applications found.
                      </strong>

                      <span>
                        Try changing your search or filter.
                      </span>

                    </div>
                  )
                }

              </div>
            )
        }


        {
          !loading &&
          pagination.count > 0 && (
            <div className="applications-pagination">

              <button
                disabled={
                  !pagination.previous
                }
                onClick={
                  () =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                }
              >
                <ChevronLeft size={17} />
                Previous
              </button>


              <span>
                Page {page}
              </span>


              <button
                disabled={
                  !pagination.next
                }
                onClick={
                  () =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                }
              >
                Next
                <ChevronRight size={17} />
              </button>

            </div>
          )
        }

      </section>

    </section>
  );
}


function ApplicationRow({
  job,
  onClick,
}) {
  return (
    <button
      type="button"
      className="application-row"
      onClick={
        () =>
          onClick?.(
            job.id
          )
      }
    >

      <div className="company-cell">

        <span
          className="company-logo"
          style={{
            background:
              getCompanyColor(
                job.company_name
              ),
          }}
        >
          {
            getInitials(
              job.company_name ||
              "Company"
            )
          }
        </span>

        <strong>
          {
            job.company_name ||
            "Company not identified"
          }
        </strong>

      </div>


      <div className="role-cell">

        <strong>
          {
            job.role_title ||
            "Role not identified"
          }
        </strong>

        <span>
          {
            job.source_display ||
            "Gmail"
          }
        </span>

      </div>


      <span>
        {
          formatDate(
            job.created_at
          )
        }
      </span>


      <StatusBadge
        status={job.status}
      />


      <span>
        {
          formatDate(
            job.last_email_at ||
            job.updated_at
          )
        }
      </span>


      <ChevronRight
        size={16}
        className="row-chevron"
      />

    </button>
  );
}


function ApplicationsSkeleton() {
  return (
    <div className="applications-skeleton">

      {
        Array.from({
          length: 6,
        }).map(
          (_, index) => (
            <div
              className="application-skeleton-row"
              key={index}
            >
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          )
        )
      }

    </div>
  );
}
