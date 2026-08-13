import datetime
import os
from typing import Any

from fastapi import Request

try:
    import zoneinfo
except ImportError:
    from backports import zoneinfo  # type: ignore
# end try

import logging
import logging.handlers


class MainLib:
    printDebugLogger = True
    LOG_TAG = "OSMainLb"
    _logger = None

    def __init__(self):
        self._setupLogger()

    # end def

    def _setupLogger(self):
        if MainLib._logger is not None:
            return

        # Create a custom logger
        logger = logging.getLogger("OSBackend")
        logger.setLevel(logging.INFO)

        # Remove existing handlers to avoid duplicates
        if logger.hasHandlers():
            logger.handlers.clear()
        # end if

        # Create formatter
        # Format: [TAG] HH:MM:SS - Message
        formatter = logging.Formatter(
            fmt="[%(name)s] %(asctime)s - %(message)s", datefmt="%H:%M:%S"
        )

        if os.getenv("ENABLE_FILE_LOGGING", "false").lower() == "true":
            # ensure log folder exists
            logFolderName = "logs"
            if not os.path.exists(logFolderName):
                os.makedirs(logFolderName, exist_ok=True)
            # end if

            currentDate = self.getCurrentDatetime("%Y%m%d", True, False, "")
            logFileName = os.path.join(logFolderName, f"main_{currentDate}.log")

            fileHandler = logging.FileHandler(logFileName, encoding="utf-8")
            fileHandler.setFormatter(formatter)
            logger.addHandler(fileHandler)
        # end if

        # Console Handler
        consoleHandler = logging.StreamHandler()
        consoleHandler.setFormatter(formatter)
        logger.addHandler(consoleHandler)

        MainLib._logger = logger

    # end def

    def getIpAddress(self, request: Request) -> str:
        headers = request.headers

        if not isinstance(headers, dict) and not hasattr(headers, "get"):
            pass
        # end if

        x_forwarded_for = (
            headers.get("X-Forwarded-For")
            if hasattr(headers, "get")
            else headers.get("X-Forwarded-For")
        )

        if x_forwarded_for:
            ips = x_forwarded_for.split(",")
            return ips[0].strip()
        # end if

        x_real_ip = (
            headers.get("X-Real-IP")
            if hasattr(headers, "get")
            else headers.get("X-Real-IP")
        )
        if x_real_ip:
            return x_real_ip
        # end if

        if hasattr(request, "client") and request.client:
            return request.client.host
        # end if

        return ""

    # end def

    def getCurrentDatetime(
        self, format_str: str, isReturnString: bool, isUsingUTC: bool, dateType: str
    ) -> Any:
        currDateTime: datetime.datetime

        if isUsingUTC:
            currDateTime = datetime.datetime.now(datetime.timezone.utc)
        else:
            try:
                # Use zoneinfo for Asia/Jakarta
                jakarta_tz = zoneinfo.ZoneInfo("Asia/Jakarta")
                currDateTime = datetime.datetime.now(jakarta_tz)
            except Exception as e:
                self.logPrint(
                    f"Failed to load timezone: {e}", self.LOG_TAG, self.printDebugLogger
                )
                currDateTime = datetime.datetime.now()
            # end try
        # end if

        if dateType == "yuanta":
            baseFmt = "%Y-%m-%dT%H:%M:%S.%f"
            baseDatetime = currDateTime.strftime(baseFmt)
            tzOffset = currDateTime.strftime("%z")

            return baseDatetime + tzOffset
        # end if

        if isReturnString:
            return currDateTime.strftime(format_str)
        # end if

        return str(currDateTime)

    # end def

    def getField(self, data: Any, key: str) -> Any:
        """Helper to get field from dict or object"""
        if isinstance(data, dict):
            return data.get(key)
        return getattr(data, key, None)

    # end def

    def formatDate(self, d: Any) -> Any:
        """Helper to format date"""
        if not d:
            return None
        if isinstance(d, datetime.datetime):
            return d.strftime("%Y-%m-%d %H:%M:%S")
        return str(d)

    # end def

    def logPrint(self, message: str, logTag: str, showMessage: bool):
        if not logTag:
            logTag = self.LOG_TAG
        # end if

        cleanedMessage = message.replace("\ufb02", "")

        if MainLib._logger:
            # extra = {'name': logTag}
            MainLib._logger.info(f"[{logTag}] {cleanedMessage}")
        else:
            currTime = self.getCurrentDatetime("%H:%M:%S", True, False, "")
            print(f"[{logTag}] {currTime} - {cleanedMessage}")
        # end if

    # end def


# end class
