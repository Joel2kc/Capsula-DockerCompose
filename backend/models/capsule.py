from datetime import datetime
import uuid
import pytz
from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field, validator
from pydantic_settings import SettingsConfigDict


def utc_now() -> datetime:
    """Get current UTC time with timezone info"""
    return datetime.now(pytz.UTC)


class Capsule(Document):
    # Core data
    uid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    creator_address: Indexed(str)
    unlock_date: Indexed(datetime)
    is_private: bool = False

    # Public NFT metadata hash (standard NFT metadata)
    nft_metadata_hash: str

    # Encrypted private metadata hash (encrypted with unlock_date + creator_address as key)
    private_metadata_hash: str

    # NFT details (set after minting)
    token_id: Optional[str] = None
    serial_number: Optional[str] = None

    # Metadata about the capsule itself
    has_media: bool = False
    media_type: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Settings:
        name = "capsules"
        indexes = [
            [("token_id", 1), ("serial_number", 1)],  # Compound unique index
            [("creator_address", 1), ("unlock_date", 1)],  # For efficient user queries
        ]

    @validator("unlock_date", pre=True)
    def ensure_timezone(cls, v):
        """Ensure unlock_date is timezone-aware and in UTC"""
        if isinstance(v, datetime):
            if v.tzinfo is None:
                v = pytz.UTC.localize(v)
            return v.astimezone(pytz.UTC)
        raise ValueError("Invalid datetime")

    @property
    def is_unlocked(self) -> bool:
        """Check if capsule is unlocked, using timezone-aware comparison"""
        return utc_now() >= self.unlock_date

    class Config:
        json_schema_extra = {
            "example": {
                "creator_address": "0.0.123456",
                "unlock_date": "2024-12-31T23:59:59Z",
                "is_private": False,
                "nft_metadata_hash": "encrypted_hash_here",
                "private_metadata_hash": "encrypted_hash_here",
                "token_id": "0.0.789012",
                "serial_number": "1",
                "has_media": True,
                "media_type": "image/jpeg"
            }
        }


class DecryptMetadataRequest(BaseModel):
    """Request model for decrypting metadata hash"""
    encrypted_hash: str = Field(..., description="Base64 encoded encrypted metadata hash", alias="encryptedHash")
    unlock_date: str = Field(..., description="ISO format unlock date string", alias="unlockDate")
    creator_address: str = Field(..., description="Creator's wallet address", alias="creatorAddress")
    contract_address: str = Field(..., description="Contract address", alias="contractAddress")

    model_config = SettingsConfigDict(populate_by_name=True)
