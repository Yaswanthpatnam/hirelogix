# HireLogix

> A privacy-conscious job application tracking platform that connects your job-search activity with your Gmail to automatically organize relevant application emails.

HireLogix is a full-stack web application built to make job-search tracking easier.

Instead of manually maintaining spreadsheets and updating application statuses, HireLogix provides a centralized dashboard where users can track applications, monitor their hiring pipeline, and connect Gmail to identify relevant job-related emails.

The application is built with a React frontend and Django REST backend, backed by PostgreSQL and deployed using modern cloud infrastructure.

---

## ✨ What HireLogix Does

HireLogix is designed around a simple workflow:

```text
Create Account
      ↓
Authenticate with Google
      ↓
Review Gmail Permissions
      ↓
Connect Gmail
      ↓
Identify Relevant Job Emails
      ↓
Organize Applications
      ↓
Track Hiring Progress
      ↓
Analyze Application Activity

The important distinction is that Google authentication and Gmail authorization are separate.

Signing in with Google creates/authenticates the HireLogix account.

Connecting Gmail is a separate, user-controlled authorization step that allows HireLogix to access the Gmail data required for job-application tracking.

🚀 Features
Authentication
Google-based user authentication
JWT access and refresh tokens
Protected application routes
Automatic access-token refresh
Explicit logout handling
Separate authentication and Gmail authorization flows
Gmail Integration
Gmail OAuth authorization
Gmail connection status detection
Gmail access-token handling
Refresh-token handling
Incremental Gmail synchronization
Detection and handling of invalid/revoked Gmail authorization
Job-focused email processing
Job Application Tracking
Centralized application tracking
Application stages
Application status/verdict tracking
Application history
Search and filtering
Application statistics
Dashboard
Application overview
Hiring pipeline visualization
Application statistics
Recent applications
Activity information
Responsive dashboard interface
Privacy & Security

HireLogix treats Gmail access as a separate permission boundary.

The application does not treat Google sign-in as automatic permission to read Gmail.

Users explicitly authorize Gmail access before Gmail synchronization begins.

When a user explicitly logs out, HireLogix clears its stored Gmail authorization state while preserving relevant application/job history.

🏗 Architecture

HireLogix currently follows a full-stack architecture:

                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React / Vite      │
                    │     Frontend        │
                    └──────────┬──────────┘
                               │
                         REST / Axios
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Django + DRF      │
                    │      Backend        │
                    └───────┬─────┬───────┘
                            │     │
              ┌─────────────┘     └──────────────┐
              ▼                                  ▼
     ┌─────────────────┐                ┌─────────────────┐
     │   PostgreSQL    │                │    Google APIs  │
     │      Neon       │                │ Gmail / OAuth   │
     └─────────────────┘                └─────────────────┘
Frontend

The frontend is responsible for:

User interface
Routing
Authentication state
API communication
Gmail connection flow
Dashboard rendering
Responsive behavior
Backend

The backend is responsible for:

User management
Google authentication
JWT generation
Gmail OAuth
Gmail token management
Gmail synchronization
Application data
API authorization
Database interaction
Database

PostgreSQL stores application and user-related data.

Neon is used as the managed PostgreSQL provider in production.

🛠 Tech Stack
Frontend
React
JavaScript
JSX
Vite
Tailwind CSS
Custom CSS
React Router
Axios
Backend
Python
Django
Django REST Framework
Simple JWT
PostgreSQL
Integrations
Google Identity Services
Google OAuth
Gmail API
Infrastructure
Vercel — Frontend deployment
Render — Backend deployment
Neon — PostgreSQL
Git
GitHub
🔐 Authentication Architecture

HireLogix uses JWT-based authentication together with Google authentication.

The authentication flow is:

User
 ↓
Google Login
 ↓
Google credential
 ↓
HireLogix backend
 ↓
Credential verification
 ↓
User creation / retrieval
 ↓
JWT access + refresh tokens
 ↓
Authenticated HireLogix session

The frontend stores the authentication tokens required to communicate with the backend.

Protected routes verify the presence of the access token before allowing access.

📧 Gmail Authorization

Gmail access is intentionally separated from account authentication.

The flow is:

Google Login
      ↓
HireLogix Account
      ↓
Permission Page
      ↓
Connect Gmail
      ↓
Google OAuth Consent
      ↓
Authorization Code
      ↓
HireLogix Backend
      ↓
Gmail Access / Refresh Tokens
      ↓
Gmail Synchronization

This separation allows HireLogix to authenticate a user without automatically requesting access to their Gmail.

🔄 Gmail Synchronization

HireLogix uses Gmail synchronization to identify relevant job-related email activity.

The system is designed with privacy in mind because a user's inbox can contain many unrelated categories of information, including:

Banking emails
Shopping emails
Social media notifications
Promotions
Personal communication
Newsletters
Spam
Job-related emails

Therefore, Gmail processing is focused on the information required for the application's job-tracking functionality rather than treating the entire mailbox as application data.

HireLogix also supports incremental synchronization so that the system does not need to repeatedly process the same Gmail data unnecessarily.

🔑 Gmail Token Lifecycle

Gmail authorization involves tokens that are different from the HireLogix JWT tokens.

HireLogix JWT

Used for:

Frontend → HireLogix Backend
Gmail OAuth tokens

Used for:

HireLogix Backend → Gmail API

These two authentication systems serve different purposes.

If a Gmail refresh token becomes invalid or authorization is revoked, HireLogix can mark the Gmail connection inactive and require the user to reconnect Gmail.

🚪 Logout Behavior

Logout is intentionally more than simply deleting a frontend token.

The logout flow is:

User clicks Logout
       ↓
HireLogix logout API
       ↓
Refresh token invalidation
       ↓
Gmail authorization cleared
       ↓
Frontend authentication data removed
       ↓
User returned to Landing Page

The Gmail connection record itself is preserved so that previously tracked job/application data is not unintentionally deleted.

The user must authorize Gmail again after reconnecting.

📊 Dashboard

The dashboard provides a centralized view of the user's job-search activity.

It includes:

Application overview
Hiring pipeline
Application statistics
Recent applications
Activity information
Application status
Application progression

The interface is designed to work across:

Desktop
Tablet
Mobile portrait
Mobile landscape
📱 Responsive Design

HireLogix is designed with responsive behavior as a core requirement rather than treating mobile as an afterthought.

The UI adapts:

Desktop
   ↓
Tablet
   ↓
Mobile Landscape
   ↓
Mobile Portrait

Particular attention is given to:

Dashboard information density
Application rows
Navigation
Authentication screens
Gmail permission flow
Touch-friendly controls
Text wrapping
Layout stability
🌍 Production Deployment

HireLogix currently uses:

Frontend

Vercel

https://hirelogix.vercel.app
Backend

Render

https://hirelogix-yfa8.onrender.com
Database

Neon PostgreSQL

The production frontend communicates with the deployed Django REST API over HTTPS.

🔧 Environment Configuration

Sensitive configuration is provided through environment variables rather than committed to the repository.

Important configuration includes:

SECRET_KEY=
DEBUG=

DATABASE_URL=

FRONTEND_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=


Frontend configuration includes:

VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=

Actual secrets should never be committed to Git.

🧪 Local Development
Clone the repository
git clone https://github.com/Yaswanthpatnam/hirelogix.git
cd hirelogix
Backend
cd backend

python -m venv venv

Activate the virtual environment.

Windows:

venv\Scripts\activate

macOS / Linux:

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Run migrations:

python manage.py migrate

Start Django:

python manage.py runserver
Frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend will communicate with the backend according to the configured environment variables.

🔗 API Architecture

The frontend communicates with Django through REST APIs.

Authentication-related endpoints include:

/user/auth/google/
/user/auth/me/
/user/auth/logout/

Gmail-related functionality includes endpoints for:

/gmail/auth/start/
/gmail/oauth/callback/
/gmail/status/
/gmail/sync/incremental/

The exact API surface may evolve as HireLogix continues to develop.

🧠 Engineering Decisions

HireLogix intentionally keeps several concerns separate.

Google Authentication vs Gmail Authorization

Google authentication answers:

"Who is this user?"

Gmail OAuth answers:

"Has this user explicitly allowed HireLogix to access Gmail?"

Keeping these separate provides a clearer security and privacy boundary.

Preserving Gmail-derived application data

Disconnecting Gmail does not automatically delete previously tracked application information.

This prevents authorization state from being unnecessarily coupled to historical application data.

Incremental synchronization

Instead of repeatedly processing the entire mailbox, incremental synchronization allows HireLogix to focus on newly relevant Gmail activity.

JWT authentication

JWT provides a stateless API authentication mechanism suitable for the React frontend and Django REST backend architecture.

🔒 Privacy Considerations

Gmail contains highly personal information.

HireLogix therefore treats Gmail access as a sensitive capability.

The system should follow the principle of least privilege:

Only request
     ↓
Only access
     ↓
Only process
     ↓
Only retain
     ↓
what HireLogix actually needs

The product is designed around explicit Gmail authorization rather than silently treating Google account authentication as Gmail permission.

🚧 Current Development Status

HireLogix is actively evolving.

The current production version includes:

Google authentication
JWT authentication
Gmail OAuth
Gmail connection management
Gmail synchronization
Job application tracking
Dashboard
Responsive UI
Production deployment

The project continues to evolve around better:

Gmail job-email detection
synchronization reliability
privacy controls
user experience
analytics
production reliability
OAuth production readiness
🗺️ Future Direction

Potential areas of future development include:

More intelligent job-email classification
Better application extraction
Improved synchronization
Advanced job-search analytics
Follow-up workflows
Better application insights
Improved privacy controls
Stronger production observability
More robust background synchronization

These are future development directions and should not be interpreted as currently implemented functionality.

🧩 Project Philosophy

HireLogix is being developed with three principles in mind:

1. Build something useful

The goal is to solve an actual problem in the job-search process.

2. Learn through real engineering problems

The project intentionally deals with real-world concerns such as:

OAuth
token lifecycle
API design
database persistence
production deployment
cloud services
synchronization
responsive UI
privacy
production debugging
3. Improve without unnecessary complexity

The architecture should evolve when the product actually needs it rather than introducing infrastructure simply because it is popular.

👤 Author

Yaswanth Babu Patnam

Full-Stack Developer

Interested in:

React
JavaScript
Django
Python
REST APIs
PostgreSQL
Cloud deployment
Software engineering
🔗 Links

Live Application

https://hirelogix.vercel.app/

GitHub

https://github.com/Yaswanthpatnam/hirelogix


### One thing I deliberately removed

I **didn't carry these from the old README into v2**:

- Redis caching
- Redis sessions
- Cloudinary resume storage
- Password reset
- SMTP password reset
- Docker as a current deployment requirement
- API throttling
- the old `jobs/` architecture

because those belong to the **previous version according to the information you've given me**, and putting them into the current README would make your README technically misleading.

Also, I wouldn't call HireLogix simply **"production-ready"** yet while the public Gmail OAuth verification is still being worked through. The app is **deployed to production**, which is a different claim from saying every production-readiness requirement is complete.

This README therefore tells the story of **HireLogix v2 as it actually exists**, rather than carrying old v1 claims forward.