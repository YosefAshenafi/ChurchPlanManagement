import json
import logging


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        for key, value in record.__dict__.items():
            if key in ("args", "msg", "levelname", "name", "exc_info",
                       "exc_text", "stack_info", "lineno", "pathname",
                       "filename", "module", "msecs", "relativeCreated",
                       "thread", "threadName", "processName", "process",
                       "created", "funcName", "levelno", "message", "asctime"):
                continue
            payload[key] = value
        return json.dumps(payload, ensure_ascii=False)
