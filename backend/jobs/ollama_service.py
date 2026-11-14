import json
import logging
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class OllamaJobAnalyzer:
    """
    Local-First Semantic Analyzer powered by Ollama (http://localhost:11434).
    100% offline, zero rate limits, zero quota exhaustion, zero cloud dependencies.
    Optimized for lightweight local models (qwen2.5:1.5b or qwen2.5:3b).
    """

    OLLAMA_HOST = getattr(settings, "OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL = getattr(settings, "OLLAMA_MODEL", "qwen2.5:1.5b")

    @classmethod
    def is_available(cls) -> bool:
        """Quick 200ms health check to see if local Ollama daemon is running."""
        try:
            res = requests.get(f"{cls.OLLAMA_HOST}/api/tags", timeout=0.3)
            return res.status_code == 200
        except Exception:
            return False

    @classmethod
    def classify_batch_pipe(cls, candidates: List[Dict[str, Any]]) -> Dict[int, Dict[str, Any]]:
        """
        Local-First Pipe-Delimited DSL Batch Classifier.
        Evaluates candidate chunks offline with zero token rate limits.
        """
        if not candidates or not cls.is_available():
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

        payload = {
            "model": cls.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 600,
            },
        }

        try:
            res = requests.post(f"{cls.OLLAMA_HOST}/api/generate", json=payload, timeout=60)
            if res.status_code != 200:
                return {}

            raw_text = res.json().get("response", "")
            for line in raw_text.strip().splitlines():
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
            logger.warning("Local Ollama batch analysis error: %s", exc)
            return {}

    @classmethod
    def analyze_candidate(
        cls,
        sender: str,
        subject: str,
        snippet: str = "",
        email_date: str = "",
    ) -> Optional[Dict[str, Any]]:
        clean_sender = (sender or "").strip()
        clean_subject = (subject or "").strip()
        clean_snippet = (snippet or "").strip()[:350]

        sys_prompt = (
            "You are a job application tracker. Return ONLY a JSON object with: "
            '{"is_job_application": true, "is_promotional_digest": false, "company_name": "Employer Name", "role_title": "Role Title", "status": "applied"|"under_review"|"assessment"|"interview"|"offer"|"rejected"}.\n'
            "CRITICAL RULES:\n"
            "- Set is_job_application=true for ANY email about a job application, referral, interview invitation, assessment/test, offer, or rejection.\n"
            "- Set is_job_application=false ONLY for newsletters, spam, courses, or bank promotions.\n"
            "- Extract the true employer name (not Greenhouse or Lever) and clean role title."
        )

        user_content = f"From: {clean_sender}\nSubj: {clean_subject}\nSnippet: {clean_snippet}"
        prompt = f"{sys_prompt}\n\nEmail to classify:\n{user_content}"

        payload = {
            "model": cls.OLLAMA_MODEL,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 180,
            },
        }

        try:
            res = requests.post(
                f"{cls.OLLAMA_HOST}/api/generate",
                json=payload,
                timeout=10,
            )
            if res.status_code != 200:
                logger.warning("Ollama returned status %d", res.status_code)
                return None

            response_data = res.json()
            raw_text = response_data.get("response", "")
            if not raw_text:
                return None

            data = json.loads(raw_text)

            valid_statuses = {"applied", "under_review", "assessment", "interview", "offer", "rejected"}
            raw_status = (data.get("status") or "").lower().strip()
            if raw_status in {"referred", "referral", "submitted", "confirmed"}:
                data["status"] = "applied"
            elif raw_status not in valid_statuses:
                data["status"] = "applied"

            return data

        except Exception as exc:
            logger.warning("Local Ollama analysis error: %s", exc)
            return None
