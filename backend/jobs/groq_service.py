import json
import logging
import re
import time
from typing import Any, Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class GroqJobAnalyzer:
    """
    High-Speed LPU Semantic Analyzer powered by Groq (qwen/qwen3.8-27b).
    Supports both ultra-fast pipe-delimited batch inference (25 emails/call)
    and single-email fallback with smart rate-limit pacing.
    """

    MODEL_NAME = getattr(settings, "GROQ_MODEL_NAME", "qwen/qwen3.8-27b")
    _client = None
    _last_request_time = 0.0
    REQUEST_INTERVAL = 0.5  # Safe pace keeps ITPM well below limits

    @classmethod
    def get_client(cls):
        api_key = getattr(settings, "GROQ_API_KEY", None)
        if not api_key:
            return None

        if cls._client is None:
            try:
                from groq import Groq
                cls._client = Groq(api_key=api_key)
            except Exception as exc:
                logger.error("Failed to initialize Groq client: %s", exc)
                return None
        return cls._client

    @classmethod
    def classify_batch_pipe(cls, candidates: List[Dict[str, Any]]) -> Dict[int, Dict[str, Any]]:
        """
        Ultra-High-Speed Pipe-Delimited DSL Batch Classifier.
        Evaluates up to 25–30 candidate emails in a SINGLE prompt.
        Uses ~200 tokens completion per batch with 0 JSON syntax bloat.
        """
        client = cls.get_client()
        if not client or not candidates:
            return {}

        results = {}
        lines = [
            "Classify job emails. Output EXACTLY 1 line per ID in this format:",
            "ID|IS_JOB(Y/N)|COMPANY|ROLE|STATUS(applied/under_review/assessment/interview/offer/rejected)",
            "Rules:",
            "- Y for real direct job applications, interview invites, coding tests, offers, rejections.",
            "- N for newsletters, job digests, aggregators, promotional blasts, or recruiter marketing.",
            "- If N, leave company/role empty: e.g. 5|N|||",
            "- COMPANY: Extract the actual employer (e.g. Oracle, UiPath, DNV). NEVER use recruitment platforms like Ashby, Greenhouse, Lever, Workday, Wellfound.",
            "- ROLE: Concise job title (e.g. Software Engineer, SDE 1, Data Analyst) or empty. NEVER full sentences or email subjects.",
            "- STATUS: Must be one of: applied, under_review, assessment, interview, offer, rejected.",
            "  * IMPORTANT: Carefully read the email snippet text! If it mentions choosing another candidate, moving forward with other candidates, not progressing, skills not aligning, or regret to inform, STATUS MUST BE 'rejected' (even if subject says 'Thank you for your application' or 'Update').",
            "  * Use 'interview' if scheduling or conducting an interview.",
            "  * Use 'assessment' for coding test, HackerRank, OA, or take-home test.",
            "  * Use 'offer' for employment offer letter.",
            "  * Default to 'applied' for initial application confirmation.",
            "Emails:",
        ]

        for cand in candidates:
            cid = cand.get("id")
            snd = (cand.get("sender") or "").replace("|", " ")[:80]
            sbj = (cand.get("subject") or "").replace("|", " ")[:100]
            snp = (cand.get("snippet") or "").replace("|", " ")[:350]
            lines.append(f"{cid}|{snd}|{sbj}|{snp}")

        prompt = "\n".join(lines)

        for attempt in range(3):
            try:
                response = client.chat.completions.create(
                    model=cls.MODEL_NAME,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    max_tokens=800,
                )
                output = response.choices[0].message.content or ""
                for line in output.strip().splitlines():
                    parts = [p.strip() for p in line.split("|")]
                    if len(parts) >= 2:
                        try:
                            item_id = int(parts[0])
                        except ValueError:
                            continue
                        is_job = parts[1].upper() == "Y"
                        comp = parts[2] if len(parts) > 2 else ""
                        role = parts[3] if len(parts) > 3 else ""
                        raw_st = parts[4].lower() if len(parts) > 4 else "applied"
                        valid_statuses = {"applied", "under_review", "assessment", "interview", "offer", "rejected"}
                        status = raw_st if raw_st in valid_statuses else "applied"
                        results[item_id] = {
                            "is_job_application": is_job,
                            "is_promotional_digest": not is_job,
                            "company_name": comp,
                            "role_title": role,
                            "status": status,
                        }
                return results

            except Exception as exc:
                err_str = str(exc)
                if "tokens per day" in err_str.lower() or "tpd" in err_str.lower():
                    logger.warning("Groq daily token limit reached. Falling back immediately to Ollama.")
                    return {}

                if "429" in err_str or "rate_limit" in err_str:
                    wait_time = 3.0
                    m = re.search(r"try again in ([\d\.]+)s", err_str)
                    if m:
                        wait_time = float(m.group(1)) + 0.5
                    if wait_time > 8.0:
                        logger.warning("Groq wait time too long (%.1fs). Falling back to Ollama.", wait_time)
                        return {}
                    logger.info("Groq 429 rate limit, sleeping %.2fs (attempt %d/3)...", wait_time, attempt + 1)
                    time.sleep(wait_time)
                    continue

                logger.warning("Groq batch analysis error: %s", exc)
                break

        return results

    @classmethod
    def analyze_candidate(
        cls,
        sender: str,
        subject: str,
        snippet: str = "",
        email_date: str = "",
    ) -> Optional[Dict[str, Any]]:
        client = cls.get_client()
        if not client:
            return None

        clean_sender = (sender or "").strip()
        clean_subject = (subject or "").strip()
        clean_snippet = (snippet or "").strip()[:350]

        sys_prompt = (
            "Classify job email. Return JSON: "
            '{"is_job_application": bool, "is_promotional_digest": bool, "company_name": str, "role_title": str, "status": "applied"|"under_review"|"assessment"|"interview"|"offer"|"rejected"}. '
            "True for direct applications, employee referrals, coding tests, interviews, offers, rejections. False for job alert digests/newsletters. "
            "Extract actual hiring employer, not ATS platform (Greenhouse, Lever, Workday)."
        )

        user_content = f"From: {clean_sender}\nSubj: {clean_subject}\nSnippet: {clean_snippet}"

        now = time.time()
        elapsed = now - cls._last_request_time
        if elapsed < cls.REQUEST_INTERVAL:
            time.sleep(cls.REQUEST_INTERVAL - elapsed)
        cls._last_request_time = time.time()

        for attempt in range(3):
            try:
                response = client.chat.completions.create(
                    model=cls.MODEL_NAME,
                    messages=[
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    max_tokens=1024,
                )

                content = response.choices[0].message.content
                if not content:
                    return None

                data = json.loads(content)
                valid_statuses = {"applied", "under_review", "assessment", "interview", "offer", "rejected"}
                raw_status = (data.get("status") or "").lower().strip()
                if raw_status in {"referred", "referral", "submitted", "confirmed"}:
                    data["status"] = "applied"
                elif raw_status not in valid_statuses:
                    data["status"] = "applied"

                return data

            except Exception as exc:
                err_str = str(exc)
                if "tokens per day" in err_str.lower() or "tpd" in err_str.lower():
                    logger.warning("Groq daily token limit reached. Skipping Groq.")
                    return None

                if "429" in err_str or "rate_limit" in err_str:
                    wait_time = 3.0
                    m = re.search(r"try again in ([\d\.]+)s", err_str)
                    if m:
                        wait_time = float(m.group(1)) + 0.5
                    if wait_time > 8.0:
                        return None
                    time.sleep(wait_time)
                    continue

                logger.warning("Groq analysis error: %s", exc)
                return None

        return None
