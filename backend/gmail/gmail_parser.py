import base64
import html
import re


class GmailMessageParser:

    @staticmethod
    def get_headers(
        message,
    ):
        payload = message.get(
            "payload",
            {}
        )

        headers = payload.get(
            "headers",
            []
        )

        header_data = {}

        for header in headers:
            name = header.get(
                "name",
                ""
            ).lower()

            value = header.get(
                "value",
                ""
            )

            header_data[name] = value

        return {
            "from": header_data.get(
                "from"
            ),
            "subject": header_data.get(
                "subject"
            ),
            "date": header_data.get(
                "date"
            ),
            "to": header_data.get(
                "to"
            ),
        }

    @staticmethod
    def decode_body_data(
        data,
    ):
        if not data:
            return ""

        try:
            decoded_bytes = (
                base64.urlsafe_b64decode(
                    data.encode("ASCII") if isinstance(data, str) else data
                )
            )
            return decoded_bytes.decode(
                "utf-8",
                errors="replace",
            )
        except Exception:
            return ""

    @classmethod
    def strip_html_tags(cls, html_content):
        if not html_content:
            return ""

        # Remove scripts and styles
        cleaned = re.sub(
            r"<(script|style).*?>.*?</\1>",
            "",
            html_content,
            flags=re.DOTALL | re.IGNORECASE,
        )
        # Convert break lines and paragraphs to newlines
        cleaned = re.sub(r"<(br|p|div|tr)[\s/>]", "\n", cleaned, flags=re.IGNORECASE)
        # Strip all other HTML tags
        cleaned = re.sub(r"<[^>]+>", " ", cleaned)
        # Unescape HTML entities (&amp;, &nbsp;, etc.)
        cleaned = html.unescape(cleaned)
        # Normalize whitespace
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)
        return cleaned.strip()

    @classmethod
    def extract_body_parts(cls, payload):
        """Recursively collect plain text and html body parts."""
        plain_texts = []
        html_texts = []

        def _traverse(part):
            mime_type = part.get("mimeType", "").lower()
            body = part.get("body", {})
            data = body.get("data")

            if data:
                decoded = cls.decode_body_data(data)
                if decoded:
                    if mime_type == "text/plain":
                        plain_texts.append(decoded)
                    elif mime_type == "text/html":
                        html_texts.append(decoded)

            for subpart in part.get("parts", []):
                _traverse(subpart)

        _traverse(payload)
        return plain_texts, html_texts

    @classmethod
    def get_clean_body_text(cls, message):
        """Returns clean plain text of the email body."""
        payload = message.get("payload", {})
        plain_texts, html_texts = cls.extract_body_parts(payload)

        if plain_texts:
            full_text = "\n".join(plain_texts)
            return re.sub(r"\s+", " ", full_text).strip()

        if html_texts:
            full_html = "\n".join(html_texts)
            stripped = cls.strip_html_tags(full_html)
            return re.sub(r"\s+", " ", stripped).strip()

        snippet = message.get("snippet", "")
        if snippet:
            return html.unescape(snippet).strip()

        return ""

    @classmethod
    def get_snippet(cls, message):
        raw_snippet = message.get("snippet", "")
        if not raw_snippet:
            return ""
        return html.unescape(raw_snippet).strip()