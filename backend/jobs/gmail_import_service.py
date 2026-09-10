import re

from datetime import timezone as datetime_timezone
from email.utils import parseaddr
from email.utils import parsedate_to_datetime

from jobs.models import JobApplication


class GmailJobApplicationImporter:

    STATUS_RULES = [
        (
            JobApplication.Status.REJECTED,
            [
                "rejected",
                "not selected",
                "application declined",
                "application unsuccessful",
                "we will not be moving forward",
            ],
        ),

        (
            JobApplication.Status.OFFER,
            [
                "offer letter",
                "job offer",
                "offer for",
                "we are pleased to offer",
            ],
        ),

        (
            JobApplication.Status.INTERVIEW,
            [
                "interview invitation",
                "interview scheduled",
                "schedule an interview",
                "interview",
            ],
        ),

        (
            JobApplication.Status.ASSESSMENT,
            [
                "technical assessment",
                "online assessment",
                "coding test",
                "online test",
                "assessment",
            ],
        ),

        (
            JobApplication.Status.UNDER_REVIEW,
            [
                "under review",
                "application status",
                "application update",
                "profile is under review",
            ],
        ),

        (
            JobApplication.Status.APPLIED,
            [
                "application received",
                "application submitted",
                "application was submitted",
                "application was sent",
                "your application was sent",
                "application sent to",
                "you applied to",
                "successfully applied",
                "successfully submitted",
                "thanks for applying",
                "thank you for applying",
                "we received your application",
            ],
        ),
    ]

    ROLE_PATTERNS = [
        r"(?:interview|assessment|offer|application)"
        r".{0,25}?\bfor\s+"
        r"([A-Za-z][A-Za-z0-9 .,&()/+_-]{2,80})",

        r"\bfor\s+the\s+"
        r"([A-Za-z][A-Za-z0-9 .,&()/+_-]{2,80})"
        r"\s+(?:role|position|opening)\b",

        r"\bas\s+a[n]?\s+"
        r"([A-Za-z][A-Za-z0-9 .,&()/+_-]{2,80})",

        r"\bposition[:\s]+"
        r"([A-Za-z][A-Za-z0-9 .,&()/+_-]{2,80})",

        r"\brole[:\s]+"
        r"([A-Za-z][A-Za-z0-9 .,&()/+_-]{2,80})",
    ]

    LINKEDIN_COMPANY_PATTERNS = [
        r"your application was sent to\s+"
        r"([A-Za-z0-9][A-Za-z0-9 .,&()'/-]{1,80})",

        r"application sent to\s+"
        r"([A-Za-z0-9][A-Za-z0-9 .,&()'/-]{1,80})",

        r"you applied to\s+"
        r"([A-Za-z0-9][A-Za-z0-9 .,&()'/-]{1,80})",
    ]

    @classmethod
    def get_status(
        cls,
        subject,
    ):
        searchable_text = (
            subject or ""
        ).lower().strip()

        for status, keywords in cls.STATUS_RULES:
            for keyword in keywords:
                if keyword in searchable_text:
                    return status

        return None

    @classmethod
    def is_linkedin_sender(
        cls,
        sender,
    ):
        _display_name, email_address = parseaddr(
            sender or ""
        )

        email_address = (
            email_address or ""
        ).lower()

        return "linkedin.com" in email_address

    @classmethod
    def get_linkedin_company_name(
        cls,
        subject,
    ):
        safe_subject = (
            subject or ""
        )

        for pattern in cls.LINKEDIN_COMPANY_PATTERNS:
            match = re.search(
                pattern,
                safe_subject,
                flags=re.IGNORECASE,
            )

            if not match:
                continue

            company_name = (
                match.group(1)
                .strip(" -–—:|.")
            )

            company_name = re.sub(
                r"\s+",
                " ",
                company_name,
            )

            if company_name:
                return company_name

        return ""

    @classmethod
    def get_company_name(
        cls,
        sender,
        subject="",
    ):
        if cls.is_linkedin_sender(sender):
            linkedin_company = (
                cls.get_linkedin_company_name(
                    subject
                )
            )

            if linkedin_company:
                return linkedin_company

            return "Company not identified"

        display_name, email_address = parseaddr(
            sender or ""
        )

        if display_name:
            return display_name.strip()

        if "@" in email_address:
            domain = (
                email_address
                .split("@", 1)[1]
            )

            domain_name = (
                domain
                .split(".", 1)[0]
            )

            return (
                domain_name
                .replace("-", " ")
                .title()
            )

        return "Company not identified"

    @classmethod
    def get_role_title(
        cls,
        subject,
    ):
        safe_subject = (
            subject or ""
        )

        for pattern in cls.ROLE_PATTERNS:
            match = re.search(
                pattern,
                safe_subject,
                flags=re.IGNORECASE,
            )

            if not match:
                continue

            role_title = (
                match.group(1)
                .strip(" -–—:|")
            )

            role_title = re.sub(
                r"\s+",
                " ",
                role_title,
            )

            invalid_titles = [
                "your application",
                "the position",
                "the role",
                "the opportunity",
            ]

            if role_title.lower() in invalid_titles:
                continue

            return role_title

        return ""

    @classmethod
    def get_email_datetime(
        cls,
        email_date,
    ):
        if not email_date:
            return None

        try:
            parsed_date = (
                parsedate_to_datetime(
                    email_date
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            return None

        if parsed_date.tzinfo is None:
            parsed_date = (
                parsed_date.replace(
                    tzinfo=datetime_timezone.utc
                )
            )

        return parsed_date

    @classmethod
    def should_update_application(
        cls,
        application,
        candidate_email_datetime,
    ):
        if not application.last_email_at:
            return True

        if not candidate_email_datetime:
            return False

        return (
            candidate_email_datetime
            >= application.last_email_at
        )

    @classmethod
    def import_candidate(
        cls,
        candidate,
    ):
        status = cls.get_status(
            candidate.subject
        )

        if not status:
            return None, False

        company_name = (
            cls.get_company_name(
                sender=candidate.sender,
                subject=candidate.subject,
            )
        )

        role_title = (
            cls.get_role_title(
                candidate.subject
            )
        )

        candidate_email_datetime = (
            cls.get_email_datetime(
                candidate.email_date
            )
        )

        application, created = (
            JobApplication.objects.get_or_create(
                user=(
                    candidate
                    .gmail_connection
                    .user
                ),
                gmail_thread_id=(
                    candidate.thread_id
                ),
                defaults={
                    "company_name":
                        company_name,

                    "role_title":
                        role_title,

                    "status":
                        status,

                    "source":
                        JobApplication.Source.GMAIL,

                    "last_gmail_message_id":
                        candidate.message_id,

                    "last_email_at":
                        candidate_email_datetime,
                },
            )
        )

        if created:
            return application, True

        if not cls.should_update_application(
            application=application,
            candidate_email_datetime=(
                candidate_email_datetime
            ),
        ):
            return application, False

        application.company_name = (
            company_name
        )

        if role_title:
            application.role_title = (
                role_title
            )

        application.status = status

        application.last_gmail_message_id = (
            candidate.message_id
        )

        application.last_email_at = (
            candidate_email_datetime
        )

        application.save(
            update_fields=[
                "company_name",
                "role_title",
                "status",
                "last_gmail_message_id",
                "last_email_at",
                "updated_at",
            ]
        )

        return application, False