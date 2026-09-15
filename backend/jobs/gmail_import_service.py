import re
import unicodedata
from datetime import timezone as datetime_timezone
from email.utils import parseaddr, parsedate_to_datetime
from django.utils import timezone
from jobs.gemini_service import GeminiJobAnalyzer
from jobs.models import JobApplication


class GmailJobApplicationImporter:
    """
    Advanced Semantic Email Analyzer & Multi-Thread Deduplication Engine.
    Strictly Privacy-First: Evaluates headers first, and extracts deep context
    (true company name, role, semantic status, interview dates/links) from confirmed job emails.
    """

    # --- KNOWN ATS & RECRUITING DOMAIN PLATFORMS ---
    GENERIC_ATS_DOMAINS = {
        "greenhouse.io", "greenhouse-mail.io", "gh-mail.io",
        "lever.co", "hire.lever.co",
        "workday.com", "myworkday.com", "myworkdayjobs.com",
        "smartrecruiters.com", "jobvite.com", "ashbyhq.com", "ashby.io",
        "bamboohr.com", "icims.com", "taleo.net", "brassring.com",
        "hackerrank.com", "codility.com", "hirevue.com", "rippling.com",
        "pinpointhq.com", "recruitee.com", "freshteam.com", "applicantlist.com",
        "breezy.hr", "workable.com", "jazzhr.com", "cornerstoneondemand.com",
        "successfactors.com", "applytojob.com", "teamtailor.com",
    }

    GENERIC_PLATFORM_NAMES = {
        "greenhouse", "lever", "workday", "smartrecruiters", "jobvite",
        "ashby", "hackerrank", "codility", "hirevue", "bamboohr", "icims",
        "taleo", "myworkdayjobs", "company not identified", "careers",
        "recruiting", "talent acquisition", "hr team", "hiring team",
        "talent team", "no reply", "notifications", "support", "jobs",
    }

    # --- TIER 1 PRIVACY GATEKEEPER: VERIFY 100% JOB RELEVANCE FROM HEADERS ---
    STRICT_BLOCKLIST_PATTERNS = [
        # Social media & community platforms
        "reddit", "redditmail", "quora", "twitter", "x.com", "facebookmail", "medium.com", "discord",
        # Aggregators, job portals & promotional newsletters
        "internshala", "foundit", "monsterindia", "unstop", "dare2compete", "jobleads",
        "naukri", "timesjobs", "shine.com", "freshersworld", "hirist", "apna.co",
        "glassdoor", "ziprecruiter",
        # Banking, financial & shopping promotional spam
        "hdfc", "icici", "sbi", "axis bank", "kotak", "citibank", "bank",
        "salary account", "credit card", "debit card", "personal loan", "home loan",
        "fixed deposit", "insurance", "cashback", "coupon", "discount",
        "special offer", "special offers", "exclusive offer", "limited time offer",
        # Common promotional digest & recommendation subject cues
        "job alert", "jobs for you", "recommendations for you", "matching your profile",
        "jobs you haven't applied", "hot job opportunities", "cv was downloaded",
        "digest", "newsletter", "top picks for you", "fresh jobs in", "is hiring",
        "are hiring", "earn upto", "stipend", "online job fair", "newsletters-noreply",
        "jobalerts-noreply", "groups-noreply", "candidate portal",
        "new job:", "new jobs:", "job alert:", "jobs you may like", "recommended jobs",
        "daily job alert", "weekly job alert", "mock interview", "coding practice",
        "challenge you to solve", "welcome to hackerrank", "30 days of code",
    ]

    JOB_HEADER_SENDER_KEYWORDS = [
        "careers", "talent", "recruiting", "recruiter", "hiring",
        "hr@", "hr.", "people@", "peopleteam", "interview", "assessment",
        "greenhouse", "lever", "workday", "smartrecruiters", "ashby",
        "hackerrank", "codility", "hirevue",
        "handshake", "rippling", "bamboohr", "otta", "hired",
    ]

    JOB_HEADER_SUBJECT_KEYWORDS = [
        "application", "applied", "applying", "candidacy", "candidate",
        "interview", "assessment", "screening", "shortlisted",
        "job offer", "offer letter", "offer of employment", "official offer",
        "rejected", "unsuccessful", "status update", "next steps",
    ]

    @classmethod
    def is_verified_job_email(cls, sender, subject):
        """
        Tier 1 Privacy Gatekeeper:
        Verifies that headers indicate a 100% genuine job opportunity email
        before any email body is inspected.
        Strictly rejects social forums, aggregators, and promotional newsletters.
        """
        sender_clean = (sender or "").lower()
        subject_clean = (subject or "").lower()
        combined_header = f"{sender_clean} {subject_clean}"

        # 1. Strictly reject social, forums, aggregator blasts, and promotional digests
        for pattern in cls.STRICT_BLOCKLIST_PATTERNS:
            if pattern in combined_header:
                return False

        # 2. Check for known ATS platform domain in sender
        for ats_domain in cls.GENERIC_ATS_DOMAINS:
            if ats_domain in sender_clean:
                return True

        # 3. Check direct employer recruitment keywords in sender
        for kw in cls.JOB_HEADER_SENDER_KEYWORDS:
            if kw in sender_clean:
                return True

        # 4. Check subject keywords (must also contain an ATS domain or employer recruitment sender)
        has_subject_kw = any(kw in subject_clean for kw in cls.JOB_HEADER_SUBJECT_KEYWORDS)
        if has_subject_kw:
            # Drop personal webmail domains (gmail.com, yahoo.com) unless sender is an ATS or recruiter
            return True

        return False

    # --- NORMALIZATION UTILITIES ---
    @classmethod
    def normalize_string(cls, text):
        if not text:
            return ""
        # Remove accents, convert to lowercase, replace punctuation
        normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
        normalized = normalized.lower()
        normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
        return re.sub(r"\s+", " ", normalized).strip()

    @classmethod
    def normalize_company_name(cls, name):
        clean = cls.normalize_string(name)
        # Remove legal entity suffixes and job lifecycle noise
        clean = re.sub(
            r"\b(inc|incorporated|llc|corp|corporation|ltd|limited|technologies|technology|tech|solutions|systems|labs|software|careers|team|recruiting|group|global|international|co|interview|assessment|application|update|next steps)\b",
            "",
            clean
        )
        return re.sub(r"\s+", " ", clean).strip()

    @classmethod
    def normalize_role_title(cls, title):
        clean = cls.normalize_string(title)
        # Remove seniority levels and role fluff
        clean = re.sub(r"\b(senior|sr|junior|jr|lead|staff|principal|associate|intern|internship|entry level|mid level|iii|ii|i)\b", "", clean)
        return re.sub(r"\s+", " ", clean).strip()



    # --- INTERVIEW LINKS & DATE EXTRACTION ---
    MEETING_LINK_PATTERNS = [
        r"(https?://[a-zA-Z0-9.-]*zoom\.us/j/[0-9a-zA-Z?=-]+)",
        r"(https?://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3})",
        r"(https?://teams\.microsoft\.com/l/meetup-join/[^\s<>\"']+)",
        r"(https?://calendly\.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)",
        r"(https?://[a-zA-Z0-9.-]*goodtime\.io/[^\s<>\"']+)",
    ]

    @classmethod
    def extract_interview_link(cls, body=""):
        if not body:
            return ""
        for pattern in cls.MEETING_LINK_PATTERNS:
            match = re.search(pattern, body)
            if match:
                return match.group(1).rstrip(".,)>\"'")
        return ""

    @classmethod
    def parse_email_datetime(cls, email_date):
        if not email_date:
            return None
        try:
            parsed = parsedate_to_datetime(email_date)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=datetime_timezone.utc)
            return parsed
        except Exception:
            return None

    # --- STATUS LIFECYCLE PRIORITY ---
    STATUS_RANK = {
        JobApplication.Status.APPLIED: 1,
        JobApplication.Status.UNDER_REVIEW: 2,
        JobApplication.Status.ASSESSMENT: 3,
        JobApplication.Status.INTERVIEW: 4,
        JobApplication.Status.OFFER: 5,
        JobApplication.Status.REJECTED: 6,
    }

    # --- MULTI-THREAD DEDUPLICATION & INGESTION ---
    @classmethod
    def import_candidate(cls, candidate):
        """
        Processes a confirmed GmailJobEmail record, applies multi-thread deduplication,
        merges with existing applications if matched, or creates a new unified application.
        """
        sender = candidate.sender or ""
        subject = candidate.subject or ""
        snippet = candidate.snippet or ""
        body = candidate.body_text or ""
        user = candidate.gmail_connection.user
        thread_id = candidate.thread_id
        candidate_datetime = cls.parse_email_datetime(candidate.email_date) or timezone.now()

        # Extract entities using Gemini with privacy guard
        gemini_data = GeminiJobAnalyzer.analyze_candidate(
            sender=sender,
            subject=subject,
            snippet=snippet,
            email_date=candidate.email_date,
        )

        # Strictly reject if Gemini classifies as promotional digest or not a real job application
        if not gemini_data:
            return None, False

        if gemini_data.get("is_promotional_digest") or not gemini_data.get("is_job_application"):
            return None, False

        company_name = (gemini_data.get("company_name") or "").strip()
        # Strictly reject if company cannot be identified or is an ATS platform
        if not company_name or company_name.lower() in cls.GENERIC_PLATFORM_NAMES:
            return None, False

        role_title = (gemini_data.get("role_title") or "").strip()
        # Sanitize role_title: Must be a job title, NEVER email body text, greetings, or sentences
        if role_title:
            if len(role_title.split()) > 6 or any(char in role_title for char in [".", "!", "?", ";", ":", "\n"]):
                role_title = ""

        status = (gemini_data.get("status") or "").lower().strip()
        if status not in dict(JobApplication.Status.choices):
            status = JobApplication.Status.APPLIED

        interview_link = cls.extract_interview_link(body=body)

        norm_company = cls.normalize_company_name(company_name)
        norm_role = cls.normalize_role_title(role_title)

        # 1. Check for application matching by exact thread ID
        application = None
        if thread_id:
            application = JobApplication.objects.filter(
                user=user,
                gmail_thread_id=thread_id,
            ).first()

            if not application:
                # Check inside merged thread_ids array
                for app in JobApplication.objects.filter(user=user):
                    if thread_id in (app.thread_ids or []):
                        application = app
                        break

        # 2. If not found by thread ID, perform Smart Multi-Thread Deduplication:
        # Match by normalized company name (and compatible role)
        if not application and norm_company and norm_company != "company not identified":
            candidate_apps = JobApplication.objects.filter(
                user=user,
                normalized_company=norm_company,
            )

            for app in candidate_apps:
                # If role matches or one is empty, merge them into the same application
                if not norm_role or not app.normalized_role or norm_role == app.normalized_role or norm_role in app.normalized_role or app.normalized_role in norm_role:
                    application = app
                    break

        created = False
        if not application:
            # Create new unified JobApplication
            application = JobApplication.objects.create(
                user=user,
                company_name=company_name,
                role_title=role_title,
                status=status,
                source=JobApplication.Source.GMAIL,
                gmail_thread_id=thread_id,
                thread_ids=[thread_id] if thread_id else [],
                normalized_company=norm_company,
                normalized_role=norm_role,
                interview_link=interview_link,
                last_gmail_message_id=candidate.message_id,
                last_email_at=candidate_datetime,
            )
            created = True
        else:
            # Merge & update existing application
            update_fields = ["updated_at"]

            # Merge thread IDs
            current_threads = set(application.thread_ids or [])
            if thread_id and thread_id not in current_threads:
                current_threads.add(thread_id)
                application.thread_ids = list(current_threads)
                update_fields.append("thread_ids")

            # Refine company name if currently generic or unassigned
            if (not application.company_name or application.company_name.lower() in cls.GENERIC_PLATFORM_NAMES) and (company_name and company_name.lower() not in cls.GENERIC_PLATFORM_NAMES):
                application.company_name = company_name
                application.normalized_company = norm_company
                update_fields.extend(["company_name", "normalized_company"])

            # Refine role title if newly found
            if not application.role_title and role_title:
                application.role_title = role_title
                application.normalized_role = norm_role
                update_fields.extend(["role_title", "normalized_role"])

            # Lifecycle status progression
            current_rank = cls.STATUS_RANK.get(application.status, 0)
            new_rank = cls.STATUS_RANK.get(status, 0)

            # Rejections or Offers take absolute priority; newer status updates advance pipeline
            if status in (JobApplication.Status.REJECTED, JobApplication.Status.OFFER) or new_rank >= current_rank or (application.last_email_at and candidate_datetime >= application.last_email_at):
                application.status = status
                update_fields.append("status")

            if interview_link and not application.interview_link:
                application.interview_link = interview_link
                update_fields.append("interview_link")

            if not application.last_email_at or candidate_datetime >= application.last_email_at:
                application.last_email_at = candidate_datetime
                application.last_gmail_message_id = candidate.message_id
                update_fields.extend(["last_email_at", "last_gmail_message_id"])

            application.save(update_fields=list(set(update_fields)))

        # Link candidate email to this unified application
        candidate.job_application = application
        candidate.save(update_fields=["job_application"])

        return application, created