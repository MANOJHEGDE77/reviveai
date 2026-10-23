import json
import hashlib
from typing import Optional, Tuple, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import IdempotencyRecord

def hash_payload(payload: Any) -> str:
    """Computes a deterministic SHA-256 hash of the request payload."""
    if payload is None:
        return "none"
    if isinstance(payload, bytes):
        return hashlib.sha256(payload).hexdigest()
    if isinstance(payload, str):
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()

class IdempotencyManager:
    """
    Durable Idempotency Engine for ReviveAI.
    Guarantees that retry webhooks, network resends, or concurrent operator requests
    never execute irreversible financial recovery actions more than once.
    """

    @classmethod
    def check_or_acquire_lock(
        cls,
        db: Session,
        idempotency_key: str,
        endpoint: str,
        request_data: Any = None
    ) -> Optional[Tuple[int, Any]]:
        """
        Checks if an idempotency key has already been processed or is currently in progress.
        Returns (response_code, cached_json_data) if already completed.
        Raises 409 Conflict if currently processing by another parallel worker.
        Returns None if key is acquired and processing may proceed.
        """
        if not idempotency_key:
            return None

        record = db.query(IdempotencyRecord).filter(IdempotencyRecord.idempotency_key == idempotency_key).first()
        req_hash = hash_payload(request_data)

        if record:
            if record.status == "COMPLETED":
                # Return cached payload
                cached = json.loads(record.response_body) if record.response_body else {}
                return (record.response_code or 200, cached)

            if record.status == "PROCESSING":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Idempotency conflict: An identical request with key '{idempotency_key}' is actively being processed."
                )

        # Acquire lock: Record new entry in PROCESSING state
        new_record = IdempotencyRecord(
            idempotency_key=idempotency_key,
            endpoint=endpoint,
            request_hash=req_hash,
            status="PROCESSING"
        )
        db.add(new_record)
        try:
            db.commit()
        except Exception:
            db.rollback()
            # Race condition: another thread created it
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Concurrent execution detected for idempotency key '{idempotency_key}'."
            )

        return None

    @classmethod
    def record_completion(
        cls,
        db: Session,
        idempotency_key: str,
        response_code: int,
        response_data: Any
    ):
        """Marks the idempotency key as COMPLETED with the cached response body."""
        if not idempotency_key:
            return

        record = db.query(IdempotencyRecord).filter(IdempotencyRecord.idempotency_key == idempotency_key).first()
        if record:
            record.status = "COMPLETED"
            record.response_code = response_code
            if isinstance(response_data, str):
                record.response_body = response_data
            else:
                record.response_body = json.dumps(response_data)
            db.commit()

    @classmethod
    def release_on_failure(cls, db: Session, idempotency_key: str):
        """Marks the record as FAILED or removes it so a legitimate retry can occur."""
        if not idempotency_key:
            return
        record = db.query(IdempotencyRecord).filter(IdempotencyRecord.idempotency_key == idempotency_key).first()
        if record and record.status == "PROCESSING":
            record.status = "FAILED"
            db.commit()
