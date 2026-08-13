import asyncio
import time
from typing import Any, Dict, Optional, Tuple


class AsyncCache:
    def __init__(self):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = asyncio.Lock()

    # end def

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache if exists and not expired"""
        async with self._lock:
            if key not in self._cache:
                return None
            # end if

            value, expiresAt = self._cache[key]
            if time.time() > expiresAt:
                del self._cache[key]
                return None
            # end if

            return value
        # end with

    # end def

    async def set(self, key: str, value: Any, ttlSeconds: int = 300) -> None:
        """Set value in cache with TTL"""
        async with self._lock:
            expiresAt = time.time() + ttlSeconds
            self._cache[key] = (value, expiresAt)
        # end with

    # end def

    async def delete(self, key: str) -> None:
        """Delete key from cache"""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
            # end if
        # end with

    # end def

    async def clear(self) -> None:
        """Clear all cache"""
        async with self._lock:
            self._cache.clear()
        # end with

    # end def


# end class
