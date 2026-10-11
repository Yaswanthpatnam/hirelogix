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

    MODEL_NAME = getattr(settings, "GEMINI_MODEL_NAME", "gemini-3.8-flash")
    FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"]

    _client = None
    _pacing_lock = threading.Lock()
    _last_request_time = 0.0
    REQUEST_INTERVAL = 1.0  # Ultra-fast, responsive pacing

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
    def _deterministic_fallback(cls, sender: str, subject: str, snippet: str = "") -> Dict[str, Any]:
        """
        Safety Net: Extracts company name and role using deterministic heuristics
        if all Gemini AI models are ever unreachable, rate-limited, or retired.
        Ensures zero applications are lost even during total AI outage.
        """
        clean_sender = (sender or "").strip()
        clean_subject = (subject or "").strip()

        # Extract company from common subject cues: "Application to [Company]", "[Company] Application", etc.
        company = ""
        m_subj = re.search(r"(?:applying to|application for|at|with)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:[!.,\-\–|]|\s+for|\s+the|\s+as|$)", clean_subject, re.IGNORECASE)
        if m_subj:
            candidate_comp = m_subj.group(1).strip()
            if len(candidate_comp.split()) <= 4 and candidate_comp.lower() not in ["the job", "software engineer", "intern", "developer"]:
                company = candidate_comp

        if not company:
            # Extract from sender display name: "Stripe Careers", "NIIT", "Google Recruiting"
            m_sender = re.match(r"^[\"']?([A-Za-z0-9\s&]+?)(?:\s+(?:Careers|Recruiting|Team|Talent|Hiring|Jobs))?[\"']?\s*<", clean_sender)
            if m_sender:
                company = m_sender.group(1).strip()

        if not company:
            # Extract from domain: "careers@larsentoubro.com" -> Larsen Toubro
            m_domain = re.search(r"@([a-zA-Z0-9.-]+)", clean_sender)
            if m_domain:
                domain_part = m_domain.group(1).split(".")[0]
                if domain_part not in ["gmail", "yahoo", "outlook", "greenhouse", "lever", "workday", "ashby"]:
                    company = domain_part.capitalize()

        # Extract role
        role = ""
        for r_pattern in [r"(Software Engineer[^\s,.]*)", r"(Software Developer[^\s,.]*)", r"(Full Stack Developer[^\s,.]*)", r"(Frontend Developer[^\s,.]*)", r"(Backend Developer[^\s,.]*)", r"(Data Analyst[^\s,.]*)", r"(Intern[^\s,.]*)"]:
            m_role = re.search(r_pattern, clean_subject, re.IGNORECASE)
            if m_role:
                role = m_role.group(1).strip()
                break

        status = "applied"
        clean_subj_lower = clean_subject.lower()
        if "interview" in clean_subj_lower:
            status = "interview"
        elif "assessment" in clean_subj_lower or "test" in clean_subj_lower or "hackerrank" in clean_subj_lower:
            status = "assessment"
        elif "offer" in clean_subj_lower:
            status = "offer"
        elif "reject" in clean_subj_lower or "unsuccessful" in clean_subj_lower:
            status = "rejected"

        return {
            "is_job_application": True,
            "is_promotional_digest": False,
            "company_name": company or "Identified Employer",
            "role_title": role,
            "status": status,
            "confidence": 0.7,
        }

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
        Cascades through models and falls back to deterministic extraction if all fail.
        """
        client = cls.get_client()
        clean_sender = (sender or "").strip()
        clean_subject = (subject or "").strip()
        clean_snippet = (snippet or "").strip()[:500]

        if not client:
            return cls._deterministic_fallback(clean_sender, clean_subject, clean_snippet)

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

        # Build dynamic ordered cascade without duplicates
        configured_model = getattr(settings, "GEMINI_MODEL_NAME", cls.MODEL_NAME)
        models_to_try = [configured_model]
        for m in cls.FALLBACK_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

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
                        continue

                    data = json.loads(response.text)
                    return data

                except Exception as exc:
                    err_str = str(exc)

                    # Handle 429: Fast switch to next model without freezing
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        logger.warning("Gemini 429 on %s, attempting fast failover...", model_name)
                        time.sleep(0.5)
                        break

                    # Handle 404 / 503 / Not Found / Retired: Try next model
                    if "404" in err_str or "NOT_FOUND" in err_str or "503" in err_str:
                        logger.warning("Model %s unavailable (%s), trying fallback...", model_name, exc)
                        break

                    logger.warning("Gemini analysis attempt %d on %s failed: %s", attempt + 1, model_name, exc)
                    if attempt < 1:
                        time.sleep(0.5)
                        continue
                    break

        # If all AI models are unavailable (e.g. expired or network outage), invoke deterministic fallback
        logger.warning("All Gemini models unavailable; activating deterministic regex safety net.")
        return cls._deterministic_fallback(clean_sender, clean_subject, clean_snippet)

