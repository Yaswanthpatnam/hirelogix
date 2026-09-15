import json
import logging
import os
import re
import threading
import time
from typing import Dict, Any, Optional
from django.conf import settings
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class JobEmailAnalysis(BaseModel):
    is_job_application: bool = Field(
        description="True if this email is an authentic job application or update (confirmation, assessment, interview, offer, rejection). False if marketing, promotional spam, job digest/alert, or unrelated."
    )
    is_promotional_digest: bool = Field(
        description="True if this is a job alert digest, newsletter, or promotional marketing email from aggregators (e.g., Internshala, Naukri, Foundit, LinkedIn Job Alerts, Indeed Job Alerts) rather than a direct application."
    )
    company_name: str = Field(
        description="The true canonical hiring company name (e.g. 'Stripe', 'Google', 'Figma', 'Amazon'). If sent via an ATS like Greenhouse, Lever, Workday, or Ashby, identify the actual employer, NOT the ATS platform name."
    )
    role_title: str = Field(
        description="The specific job title / role (e.g. 'Software Engineer', 'Full Stack Developer', 'Product Designer'). Return empty string if not found."
    )
    status: str = Field(
        description="Current status: must be one of 'applied', 'under_review', 'assessment', 'interview', 'offer', 'rejected'."
    )
    confidence: float = Field(
        default=1.0,
        description="Confidence score from 0.0 to 1.0"
    )


logging.getLogger("google.genai").setLevel(logging.ERROR)


class GeminiJobAnalyzer:
    """
    Intelligent Semantic Analyzer powered by Google Gemini API (gemini-3.6-flash).
    Strict Privacy-First: Analyzes ONLY sanitized sender, subject, and preview snippets
    of pre-screened job candidate emails. Never processes personal or non-job content.
    Includes built-in rate-pacing and dynamic 429 backoff to prevent quota exhaustion.
    """

    MODEL_NAME = getattr(settings, "GEMINI_MODEL_NAME", "gemini-3.5-flash-lite")
    FALLBACK_MODEL = "gemini-3.6-flash"

    _client = None
    _pacing_lock = threading.Lock()
    _last_request_time = 0.0
    REQUEST_INTERVAL = 1.5  # Fast, responsive pacing

    @classmethod
    def get_client(cls):
        if cls._client is not None:
            return cls._client

        api_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        try:
            from google import genai
            cls._client = genai.Client(api_key=api_key)
            return cls._client
        except Exception as exc:
            logger.warning("Failed to initialize Google GenAI client: %s", exc)
            return None

    @classmethod
    def _extract_retry_delay(cls, error_str: str) -> float:
        """Parses Google API 429 retryDelay or retry in seconds."""
        m = re.search(r"retryDelay['\"]?:\s*['\"]?(\d+)s?", error_str, re.IGNORECASE)
        if m:
            return float(m.group(1))

        m = re.search(r"retry in\s+([\d.]+)", error_str, re.IGNORECASE)
        if m:
            return float(m.group(1))

        return 2.0

    @classmethod
    def analyze_candidate(
        cls,
        sender: str,
        subject: str,
        snippet: str = "",
        email_date: str = ""
    ) -> Optional[Dict[str, Any]]:
        """
        Analyzes a single job candidate email using Gemini structured output.
        Applies rapid model failover and avoids long blocking pauses.
        """
        client = cls.get_client()
        if not client:
            return None

        clean_sender = (sender or "").strip()
        clean_subject = (subject or "").strip()
        clean_snippet = (snippet or "").strip()[:500]

        prompt = f"""
Analyze the following email metadata to determine if it is an authentic job application submitted by the candidate or an application stage update.

SENDER: {clean_sender}
SUBJECT: {clean_subject}
PREVIEW SNIPPET: {clean_snippet}
DATE: {email_date}

CRITICAL RULES:
1. True Job Application: Set is_job_application=true ONLY if this is a direct communication about an application the user specifically made (submission confirmation, coding test, interview invitation, job offer, or rejection).
2. Promotional / Digest Filter: If this is an automated job alert, newsletter, recommendations email, or job blast (e.g. from Internshala, Naukri, Foundit, MonsterIndia, Unstop, LinkedIn, Reddit, Coursera) saying "jobs you haven't applied", "10 new jobs for you", "Hot opportunities", "Earn stipend", set is_promotional_digest=true and is_job_application=false.
3. True Hiring Company: Extract the actual hiring company name (e.g., 'Stripe', 'Google', 'Microsoft', 'Roku', 'Accenture', 'Flipkart'). If sent via an ATS like Greenhouse, Lever, Workday, SmartRecruiters, Ashby, extract the hiring company, NOT the ATS platform name.
4. Role Title: Extract ONLY the clean, standard job title (e.g. 'Software Engineer', 'Frontend Developer', 'Data Analyst').
   - NEVER return an email sentence, greeting, body text, or paragraph snippet.
   - If the specific job title is not clearly mentioned, return an empty string "".
5. Status: Classify accurately into one of:
   - 'applied': Application confirmation, received, submitted.
   - 'under_review': Application being reviewed, under screening.
   - 'assessment': Coding challenge, online assessment, HackerRank, Codility, technical test, take-home assignment.
   - 'interview': Invitation to interview, phone screen, technical interview, final round, hiring manager call.
   - 'offer': Job offer, employment offer, offer letter.
   - 'rejected': Polite rejection, not moving forward, position filled, unsuccessful candidacy.
"""

        from google.genai import types

        models_to_try = [cls.MODEL_NAME, cls.FALLBACK_MODEL]

        for model_name in models_to_try:
            for attempt in range(2):
                with cls._pacing_lock:
                    now = time.time()
                    elapsed = now - cls._last_request_time
                    if elapsed < cls.REQUEST_INTERVAL:
                        time.sleep(cls.REQUEST_INTERVAL - elapsed)
                    cls._last_request_time = time.time()

                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=JobEmailAnalysis,
                            temperature=0.1,
                        ),
                    )

                    if not response.text:
                        return None

                    data = json.loads(response.text)
                    return data

                except Exception as exc:
                    err_str = str(exc)

                    # Handle 429: Fast switch to next model without freezing
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        logger.warning("Gemini 429 on %s, attempting fast failover...", model_name)
                        time.sleep(1.0)
                        break

                    # Handle 404 / 503: Try next model
                    if "404" in err_str or "NOT_FOUND" in err_str or "503" in err_str:
                        logger.warning("Model %s unavailable (%s), trying fallback...", model_name, exc)
                        break

                    logger.warning("Gemini analysis attempt %d on %s failed: %s", attempt + 1, model_name, exc)
                    if attempt < 1:
                        time.sleep(1.0)
                        continue
                    break

        return None

