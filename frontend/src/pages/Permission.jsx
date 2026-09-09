import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  getGmailConnectionStatus,
  startGmailAuthorization,
} from "../services/gmail";


export default function Permission() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const [
    connecting,
    setConnecting,
  ] =
    useState(false);

  const [
    checkingConnection,
    setCheckingConnection,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");


  useEffect(
    () => {
      let cancelled = false;

      const checkConnection =
        async () => {
          try {
            const data =
              await getGmailConnectionStatus();

            if (
              cancelled
            ) {
              return;
            }

            if (
              data?.connected
            ) {
              navigate(
                "/dashboard",
                {
                  replace: true,
                }
              );

              return;
            }

            const gmailError =
              searchParams.get(
                "gmail_error"
              );

            if (gmailError) {
              setError(
                "Gmail connection was not completed. Please try again."
              );
            }
          } catch (
            err
          ) {
            console.error(
              "Unable to check Gmail connection:",
              err
            );

            if (
              !cancelled
            ) {
              setError(
                "We could not verify the Gmail connection right now. Please try again."
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              setCheckingConnection(
                false
              );
            }
          }
        };

      checkConnection();

      return () => {
        cancelled = true;
      };
    },
    [
      navigate,
      searchParams,
    ]
  );


  const handleConnectGmail =
    async () => {
      try {
        setConnecting(true);
        setError("");

        const data =
          await startGmailAuthorization();

        const authorizationUrl =
          data?.authorization_url;

        if (
          !authorizationUrl
        ) {
          throw new Error(
            "Gmail authorization URL was not returned."
          );
        }

        window.location.assign(
          authorizationUrl
        );
      } catch (
        err
      ) {
        console.error(
          "Gmail authorization failed:",
          err
        );

        setError(
          "Unable to connect Gmail right now. Please try again."
        );

        setConnecting(false);
      }
    };


  if (
    checkingConnection
  ) {
    return (
      <main className="permission-page permission-checking-page">

        <div className="permission-checking-card">

          <div className="permission-checking-icon">
            <Loader2
              size={26}
              className="permission-spin"
            />
          </div>

          <div>
            <span>
              HIRELOGIX
            </span>

            <h1>
              Checking your Gmail connection
            </h1>

            <p>
              Preparing your job search workspace…
            </p>
          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="permission-page">

      <div className="permission-glow permission-glow-one" />
      <div className="permission-glow permission-glow-two" />

      <div className="permission-container">

        <header className="permission-header">
          <div className="permission-brand">
            <div className="permission-brand-mark">
              H
            </div>

            <span>
              HireLogix
            </span>
          </div>
        </header>


        <section className="permission-content">

          <div className="permission-eyebrow">
            <span className="permission-eyebrow-dot" />
            ONE LAST STEP
          </div>


          <h1>
            Let HireLogix
            <br />
            understand your
            <br />
            <em>
              job search.
            </em>
          </h1>


          <p className="permission-intro">
            Your HireLogix account is connected.
            Now connect Gmail so HireLogix can
            automatically detect job application
            emails and keep your application status
            up to date.
          </p>


          <div className="permission-card">

            <div className="permission-card-header">

              <div className="permission-icon">
                <Mail size={23} />
              </div>

              <div>
                <h2>
                  Gmail access
                </h2>

                <p>
                  Required for automatic tracking
                </p>
              </div>

            </div>


            <div className="permission-divider" />


            <div className="permission-list">

              <PermissionItem
                title="Detect job application emails"
                description="Identify emails related to jobs you've applied for."
              />

              <PermissionItem
                title="Track application updates"
                description="Detect interview, rejection, offer and other application updates."
              />

              <PermissionItem
                title="Keep your dashboard updated"
                description="Automatically reflect meaningful changes in your applications."
              />

            </div>


            <div className="permission-privacy">

              <div className="privacy-security-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <strong>
                  Your privacy comes first.
                </strong>

                <p>
                  HireLogix requests read-only Gmail access for job-application tracking.
                  We don't send or delete emails, and we don't sell your data.
                </p>
              </div>

            </div>


            {
              error && (
                <div className="permission-error">
                  <AlertCircle size={17} />

                  <span>
                    {error}
                  </span>
                </div>
              )
            }


            <button
              className="permission-connect"
              onClick={handleConnectGmail}
              disabled={connecting}
            >
              <span>
                {
                  connecting
                    ? (
                      <Loader2
                        size={18}
                        className="permission-spin"
                      />
                    )
                    : (
                      <Mail size={18} />
                    )
                }

                {
                  connecting
                    ? "Connecting Gmail..."
                    : "Connect Gmail"
                }
              </span>

              <ArrowRight size={19} />
            </button>


            <p className="permission-note">
              You'll be redirected to Google to review and approve the requested Gmail permissions.
            </p>

          </div>


          <div className="permission-security">
            <LockKeyhole size={14} />

            <span>
              Secure connection · You can revoke access anytime
            </span>
          </div>

        </section>


        <footer className="permission-footer">
          <span>
            HireLogix
          </span>

          <span>
            Privacy-first job tracking
          </span>
        </footer>

      </div>

    </main>
  );
}


function PermissionItem({
  title,
  description,
}) {
  return (
    <div className="permission-item">

      <div className="permission-check">
        <Check size={14} />
      </div>

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>

    </div>
  );
}
