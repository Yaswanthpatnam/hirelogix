import base64


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
        }


    @staticmethod
    def decode_body_data(
        data,
    ):

        if not data:

            return ""

        decoded_bytes = (
            base64.urlsafe_b64decode(
                data
            )
        )

        return decoded_bytes.decode(
            "utf-8",
            errors="replace",
        )


    @classmethod
    def find_body_part(
        cls,
        part,
    ):

        mime_type = part.get(
            "mimeType",
            ""
        )

        body = part.get(
            "body",
            {}
        )

        data = body.get(
            "data"
        )

        if (
            mime_type in (
                "text/plain",
                "text/html",
            )
            and data
        ):

            return {
                "mime_type":
                    mime_type,

                "data":
                    data,
            }

        parts = part.get(
            "parts",
            []
        )

        for nested_part in parts:

            result = (
                cls.find_body_part(
                    nested_part
                )
            )

            if result:

                return result

        return None


    @classmethod
    def get_body(
        cls,
        message,
    ):

        payload = message.get(
            "payload",
            {}
        )

        body_part = (
            cls.find_body_part(
                payload
            )
        )

        if not body_part:

            return {
                "mime_type":
                    None,

                "content":
                    "",
            }

        decoded_content = (
            cls.decode_body_data(
                body_part["data"]
            )
        )

        return {
            "mime_type":
                body_part["mime_type"],

            "content":
                decoded_content,
        }