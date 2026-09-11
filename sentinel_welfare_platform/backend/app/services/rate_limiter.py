import time
from typing import Dict, List, Tuple
from fastapi import HTTPException, status

class SlidingWindowRateLimiter:
    """
    Sliding-window rate limiter tracking request timestamps per identifier.
    Guarantees strict maximum requests within any rolling time window.
    """
    def __init__(self):
        self._records: Dict[str, List[float]] = {}

    def check_rate_limit(
        self,
        key: str,
        max_requests: int = 5,
        window_seconds: int = 3600
    ) -> Tuple[bool, int]:
        """
        Evaluate if a request under 'key' is permitted.
        Returns:
            (is_allowed: bool, retry_after_seconds: int)
        """
        now = time.time()
        window_start = now - window_seconds

        timestamps = self._records.get(key, [])
        # Retain only timestamps within the rolling window
        valid_timestamps = [t for t in timestamps if t > window_start]

        if len(valid_timestamps) >= max_requests:
            oldest_in_window = valid_timestamps[0]
            retry_after = int(oldest_in_window + window_seconds - now) + 1
            self._records[key] = valid_timestamps
            return False, max(retry_after, 1)

        valid_timestamps.append(now)
        self._records[key] = valid_timestamps
        return True, 0

    def enforce_rate_limit(
        self,
        key: str,
        max_requests: int = 5,
        window_seconds: int = 3600,
        action_name: str = "OTP requests"
    ):
        """
        Enforce rate limit, raising HTTP 429 with Retry-After header if exceeded.
        """
        allowed, retry_after = self.check_rate_limit(key, max_requests, window_seconds)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: Maximum {max_requests} {action_name} per hour. Please retry after {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

    def reset(self, key: str = None):
        """Reset rate limit state for a key or all keys (useful for test fixtures)."""
        if key is None:
            self._records.clear()
        elif key in self._records:
            del self._records[key]

rate_limiter = SlidingWindowRateLimiter()
