import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import api from "../utils/api";


function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.71-.06-1.39-.18-2.04H12v3.86h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.21Z"
      />

      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.04H3.26v2.53A9.74 9.74 0 0 0 12 21.5Z"
      />

      <path
        fill="#FBBC05"
        d="M6.51 13.57A5.86 5.86 0 0 1 6.2 12c0-.54.1-1.07.31-1.57V7.9H3.26A9.5 9.5 0 0 0 2.25 12c0 1.48.35 2.88 1.01 4.1l3.25-2.53Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.39c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.49 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.74 5.4l3.25 2.53C7.29 8.11 9.45 6.39 12 6.39Z"
      />
    </svg>
  );
}


export default function Landing() {

  const navigate =
    useNavigate();


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  /*
   * Google successfully authenticated the user.
   *
   * GoogleLogin gives us a credential.
   *
   * We send that credential to Django.
   *
   * Django will:
   *
   * 1. Verify the Google credential.
   * 2. Find/create our HireLogix user.
   * 3. Create JWT access + refresh tokens.
   * 4. Tell us whether this is a new user.
   *
   * IMPORTANT:
   *
   * Google authentication and Gmail authorization
   * are two separate things.
   *
   * Being an existing HireLogix user does NOT mean
   * that Gmail is currently connected.
   */
  const handleGoogleSuccess =
    async (credentialResponse) => {

      try {

        setLoading(true);

        setError("");


        const credential =
          credentialResponse?.credential;


        if (!credential) {

          throw new Error(
            "Google did not return a credential."
          );

        }


        const response =
          await api.post(
            "/user/auth/google/",
            {
              credential:
                credential,
            }
          );


        /*
         * Store JWT tokens.
         *
         * The access token is used for
         * authenticated API requests.
         *
         * The refresh token is used to
         * obtain a new access token later.
         */

        localStorage.setItem(
          "access",
          response.data.access
        );


        localStorage.setItem(
          "refresh",
          response.data.refresh
        );


        /*
         * Store basic user information
         * for frontend UI.
         */

        localStorage.setItem(
          "user",
          JSON.stringify(
            response.data.user
          )
        );


        /*
         * Store whether Django considers
         * this a new HireLogix account.
         *
         * This value may still be useful
         * elsewhere in the application.
         *
         * It must NOT determine whether
         * Gmail permission is required.
         */

        localStorage.setItem(
          "is_new_user",
          String(
            response.data.is_new_user
          )
        );


        /*
         * Authentication succeeded.
         *
         * Gmail authorization is separate.
         *
         * ALWAYS send the user through the
         * Gmail permission page.
         *
         * Permission.jsx will call:
         *
         * GET /gmail/status/
         *
         * and decide:
         *
         * connected = true
         *     -> dashboard
         *
         * connected = false
         *     -> show Connect Gmail
         */

        navigate(
          "/permission",
          {
            replace: true,
          }
        );


      } catch (err) {

        console.error(
          "Google login failed:",
          err
        );


        setError(
          "Unable to sign in with Google. Please try again."
        );


      } finally {

        setLoading(false);

      }

    };


  /*
   * Google authentication failed
   * before reaching our backend.
   */

  const handleGoogleError =
    () => {

      setLoading(false);

      setError(
        "Google sign-in was cancelled or failed. Please try again."
      );

    };


  return (

    <main className="landing-page">


      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <section className="landing-left">


        {/* BRAND */}

        <div className="landing-brand">

          <div className="brand-symbol">
            H
          </div>


          <div>

            <div className="brand-name">
              HireLogix
            </div>

            <div className="brand-tagline">
              THE CALMER WAY TO JOB HUNT
            </div>

          </div>

        </div>


        {/* HERO */}

        <div className="landing-hero">


          <p className="landing-eyebrow">
            SMART JOB APPLICATION TRACKING
          </p>


          <h1>

            Your job search,
            <br />

            finally under
            <br />

            <em>control.</em>

          </h1>


          <p className="landing-description">

            Track applications, follow every update,
            and understand your job search without
            spreadsheets.

          </p>


          {/* APPLICATION JOURNEY */}

          <div className="journey">

            <div className="journey-line" />


            {[
              "Applied",
              "Screening",
              "Interview",
              "Offer",
            ].map(
              (step, index) => (

                <div
                  className="journey-step"
                  key={step}
                >

                  <div
                    className={`journey-dot ${
                      index === 0
                        ? "active"
                        : ""
                    }`}
                  >

                    {index + 1}

                  </div>


                  <span>
                    {step}
                  </span>

                </div>

              )
            )}

          </div>

        </div>


        {/* PRIVACY */}

        <p className="landing-privacy">

          Your inbox stays yours. HireLogix uses
          read-only Gmail access to identify
          job-related application emails.

        </p>


      </section>


      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <section className="landing-right">


        <div className="auth-card">


          {/* STATUS */}

          <div className="auth-status">

            <span />

            WELCOME TO HIRELOGIX

          </div>


          {/* HEADING */}

          <h2>

            Start tracking
            <br />

            your job search.

          </h2>


          {/* DESCRIPTION */}

          <p className="auth-description">

            Sign in with Google to create your
            HireLogix account and continue.
            Gmail access is requested separately
            and is read-only.

          </p>


          {/* =================================================
              GOOGLE LOGIN
          ================================================= */}

          <div className="google-login-wrapper">

            {loading ? (

              <div className="google-loading">

                <span className="google-loading-spinner" />

                Connecting...

              </div>

            ) : (

              <GoogleLogin

                onSuccess={
                  handleGoogleSuccess
                }

                onError={
                  handleGoogleError
                }

                useOneTap={false}

                theme="filled_white"

                size="large"

                text="continue_with"

                shape="rectangular"

                width="100%"

              />

            )}

          </div>


          {/* ERROR */}

          {error && (

            <p className="auth-error">

              {error}

            </p>

          )}


          {/* TERMS */}

          <p className="auth-terms">

            By continuing, you agree to our{" "}

            <span>
              Terms
            </span>

            {" "}and{" "}

            <span>
              Privacy Policy
            </span>

            .

          </p>


          {/* SECURITY */}

          <div className="auth-secure">

            <span className="auth-secure-check">
              ✓
            </span>

            Read-only Gmail access for job tracking

          </div>


        </div>


      </section>


    </main>

  );

}