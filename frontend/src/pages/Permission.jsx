import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
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
  syncHistoricalGmail,
} from "../services/gmail";


export default function Permission() {
  const navigate =
    useNavigate();

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

  const [
    checkingMessage,
    setCheckingMessage,
  ] =
    useState("Preparing your job-search workspace…");

  useEffect(() => {
    let cancelled = false;

    const checkConnection = async () => {
      try {
        const data = await getGmailConnectionStatus();

        if (cancelled) {
          return;
        }

        if (!data?.connected) {
          setCheckingConnection(false);

          const gmailError = new URLSearchParams(window.location.search).get("gmail_error");
          if (gmailError) {
            setError("Gmail connection was not completed. Please try again.");
          }
          return;
        }

        if (cancelled) {
          return;
        }

        // Transition immediately to dashboard!
        setCheckingConnection(false);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("Unable to check Gmail connection:", err);
        if (!cancelled) {
          setError(
            err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "We could not verify the Gmail connection right now. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setCheckingConnection(false);
        }
      }
    };

    checkConnection();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleConnectGmail = async () => {
    try {
      setConnecting(true);
      setError("");

      const data = await startGmailAuthorization();

      if (data?.already_connected) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const authorizationUrl = data?.authorization_url;

      if (!authorizationUrl) {
        throw new Error(
          "Gmail authorization URL was not returned."
        );
      }

      window.location.assign(authorizationUrl);
    } catch (err) {
      console.error("Gmail authorization failed:", err);
      setError("Unable to connect Gmail right now. Please try again.");
      setConnecting(false);
    }
  };


  if (
    checkingConnection
  ) {
    return (
      <main className="permission-page">
        <div className="permission-glow permission-glow-one" />
        <div className="permission-glow permission-glow-two" />
        <div className="permission-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "75vh" }}>
          <div style={{ textAlign: "center", maxWidth: "480px" }}>
            <div style={{ display: "inline-flex", padding: "16px", borderRadius: "18px", background: "rgba(135, 59, 191, 0.14)", color: "var(--brand-light)", marginBottom: "20px" }}>
              <Loader2
                size={30}
                className="permission-spin"
              />
            </div>

            <div style={{ color: "var(--brand-light)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", marginBottom: "8px" }}>
              HIRELOGIX
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 500, margin: "0 0 10px", color: "var(--text-primary)" }}>
              Checking your connection
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
              {checkingMessage}
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
            identify job-related emails and keep
            your application status up to date.
            We use read-only Gmail access for this.
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
                  Read-only access for job tracking
                </p>
              </div>

            </div>


            <div className="permission-divider" />


            <div className="permission-list">

              <PermissionItem
                title="Filter for job-related emails"
                description="HireLogix looks for messages that match job-search signals such as applications, interviews, assessments, offers and rejections."
              />

              <PermissionItem
                title="Use only the email information needed"
                description="We use the sender, subject and date of relevant messages to identify application activity and updates."
              />

              <PermissionItem
                title="Keep your applications updated"
                description="Relevant email activity is used to create or update your job applications and keep your dashboard current."
              />

            </div>


            <div className="permission-privacy">

              <div className="privacy-security-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <strong>
                  Privacy-first Gmail access.
                </strong>

                <p>
                  HireLogix filters Gmail for
                  job-related messages instead of
                  processing your inbox indiscriminately.
                  We use limited email metadata for
                  application tracking and do not store
                  email bodies or attachments.
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


            {
              /*
               * Gmail is connected. The first historical synchronization
               * starts automatically and runs before the dashboard opens.
               */
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
              You'll be redirected to Google to
              review and approve the requested
              read-only Gmail permission.
            </p>

          </div>


          <div className="permission-security">

            <LockKeyhole size={14} />

            <span>
              Read-only Gmail access · Secure connection
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

