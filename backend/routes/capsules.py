from datetime import datetime, timedelta
import pytz
from typing import Optional
from fastapi import APIRouter, UploadFile, Form, HTTPException
from pydantic import BaseModel, Field
from pydantic_settings import SettingsConfigDict
from models.capsule import Capsule, DecryptMetadataRequest
from services.ipfs import ipfs
from services.encryption import encrypt_metadata_hash, decrypt_metadata_hash
from services.logging import init_logger
from config.settings import get_settings

router = APIRouter()
logger = init_logger()
settings = get_settings()


class TrackCapsuleRequest(BaseModel):
    token_id: str = Field(alias="tokenId")
    serial_number: str = Field(alias="serialNumber")
    address: str = Field(alias="address")

    model_config = SettingsConfigDict(populate_by_name=True)


def get_utc_now() -> datetime:
    """Get current UTC time with timezone info"""
    return datetime.now(pytz.UTC)


@router.post("/upload")
async def create_capsule(
    message: str = Form(...),
    unlock_date: datetime = Form(...),
    is_private: bool = Form(False),
    creator_address: str = Form(...),
    file: Optional[UploadFile] = None
):
    logger.info(f"Creating capsule for {creator_address} with unlock date {unlock_date}")

    try:
        # Ensure unlock_date is timezone-aware and in UTC
        if unlock_date.tzinfo is None:
            logger.debug("Converting naive unlock_date to UTC")
            unlock_date = pytz.UTC.localize(unlock_date)
        else:
            unlock_date = unlock_date.astimezone(pytz.UTC)

        # Validate unlock date (must be at least 2 minutes in the future)
        now = get_utc_now()
        min_unlock_time = now + timedelta(minutes=2)
        if unlock_date <= min_unlock_time:
            logger.warning(f"Invalid unlock date {unlock_date} for {creator_address} - must be at least 2 minutes in the future")
            raise HTTPException(status_code=400, detail="Unlock date must be at least 2 minutes in the future")

        # Upload file to IPFS if provided
        media_hash = None
        media_type = None
        if file:
            logger.info(f"Uploading file {file.filename} ({file.content_type}) to IPFS")
            try:
                file_content = await file.read()
                media_hash = await ipfs.upload_file(file_content)
                media_type = file.content_type
                logger.info(f"File uploaded to IPFS with hash {media_hash}")
            except Exception as e:
                logger.error(f"Failed to upload file to IPFS: {str(e)}")
                raise HTTPException(status_code=500, detail="Failed to upload file to IPFS")

        # Create standard NFT metadata (public)
        nft_name = f"Capsula #{int(unlock_date.timestamp())}"
        nft_description = f"A time-locked message that unlocks on {unlock_date.strftime('%B %d, %Y at %I:%M %p UTC')}"
        nft_image = "https://ipfs.io/ipfs/QmcqZCbfDUZ22CtF5JjbF2QNfoYG77JCwRWcY6JRtHqTtK"  # Default placeholder image

        try:
            # Upload public NFT metadata
            nft_metadata_hash = await ipfs.upload_nft_metadata(
                name=nft_name,
                description=nft_description,
                image_url=nft_image,
                unlock_date=unlock_date.isoformat()
            )
            logger.info(f"Public NFT metadata uploaded to IPFS with hash {nft_metadata_hash}")

            # Upload private capsule metadata (encrypted)
            media_url = f"https://ipfs.io/ipfs/{media_hash}" if media_hash else None
            private_metadata_hash = await ipfs.upload_private_metadata(
                message=message,
                unlock_date=unlock_date.isoformat(),
                media_type=media_type,
                media_url=media_url
            )
            logger.info(f"Private metadata uploaded to IPFS with hash {private_metadata_hash}")
        except Exception as e:
            logger.error(f"Failed to upload metadata to IPFS: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload metadata to IPFS")

        # Encrypt the private metadata hash
        try:
            encrypted_private_hash = encrypt_metadata_hash(
                private_metadata_hash,
                unlock_date,
                creator_address,
                settings.hedera_capsula_address
            )
            logger.debug("Private metadata hash encrypted successfully")
        except Exception as e:
            logger.error(f"Failed to encrypt private metadata hash: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to encrypt private metadata")

        # Create capsule in database
        try:
            capsule = Capsule(
                creator_address=creator_address,
                unlock_date=unlock_date,
                is_private=is_private,
                nft_metadata_hash=nft_metadata_hash,
                private_metadata_hash=encrypted_private_hash,
                has_media=bool(file),
                media_type=media_type
            )
            await capsule.insert()
            logger.info(f"Capsule created with ID {str(capsule.id)}")
        except Exception as e:
            logger.error(f"Failed to create capsule in database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to save capsule")

        return {
            "id": str(capsule.uid),
            "metadata_hash": nft_metadata_hash,  # Return public NFT metadata hash for minting
            "private_metadata_hash": encrypted_private_hash  # Return encrypted private metadata hash
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error creating capsule: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/user/{address}")
async def get_user_capsules(address: str):
    logger.info(f"Fetching capsules for user {address}")
    try:
        capsules = await Capsule.find(Capsule.creator_address == address).to_list()

        # Convert to response format
        capsule_list = []
        for capsule in capsules:
            capsule_data = {
                "id": str(capsule.uid),
                "creator_address": capsule.creator_address,
                "unlock_date": capsule.unlock_date.isoformat(),
                "is_private": capsule.is_private,
                "has_media": capsule.has_media,
                "media_type": capsule.media_type,
                "token_id": capsule.token_id,
                "serial_number": capsule.serial_number,
                "nft_metadata_hash": capsule.nft_metadata_hash,  # Return public NFT metadata hash
                "private_metadata_hash": capsule.private_metadata_hash,  # Return encrypted private hash
                "created_at": capsule.created_at.isoformat(),
                "is_unlocked": capsule.is_unlocked,
            }
            capsule_list.append(capsule_data)

        logger.info(f"Found {len(capsule_list)} capsules for {address}")
        return capsule_list

    except Exception as e:
        logger.exception(f"Failed to fetch capsules for {address}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch capsules")


@router.get("/user/{address}/{capsule_id}")
async def get_capsule_by_id(address: str, capsule_id: str):
    """Get a single capsule by ID for a specific address"""
    logger.info(f"Fetching capsule {capsule_id} for address: {address}")

    try:
        # Find the specific capsule
        capsule = await Capsule.find_one(
            Capsule.uid == capsule_id,
            # Capsule.creator_address == address
        )

        if not capsule:
            logger.warning(f"Capsule {capsule_id} not found for address {address}")
            raise HTTPException(status_code=404, detail="Capsule not found")

        logger.info(f"Found capsule {capsule_id} for address {address}")

        # Convert to response format (same as get_user_capsules)
        capsule_data = {
            "id": str(capsule.uid),
            "creator_address": capsule.creator_address,
            "unlock_date": capsule.unlock_date.isoformat(),
            "is_private": capsule.is_private,
            "has_media": capsule.has_media,
            "media_type": capsule.media_type,
            "token_id": capsule.token_id,
            "serial_number": capsule.serial_number,
            "nft_metadata_hash": capsule.nft_metadata_hash,  # Return public NFT metadata hash
            "private_metadata_hash": capsule.private_metadata_hash,  # Return encrypted private hash
            "created_at": capsule.created_at.isoformat(),
            "is_unlocked": capsule.is_unlocked,
        }

        logger.info(f"Returning capsule {capsule_id}")
        return capsule_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch capsule {capsule_id} for address {address}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch capsule: {str(e)}")


@router.post("/decrypt-metadata")
async def decrypt_metadata(request: DecryptMetadataRequest):
    """Decrypt metadata hash for viewing capsule content"""
    logger.info(f"Decrypting metadata for capsule")
    logger.info(f"Request data: encrypted_hash={request.encrypted_hash[:50]}..., unlock_date={request.unlock_date}, creator_address={request.creator_address}")

    try:
        # Convert string unlock_date to datetime object
        unlock_datetime = datetime.fromisoformat(request.unlock_date.replace('Z', '+00:00'))

        # Decrypt the metadata hash
        decrypted_hash = decrypt_metadata_hash(
            request.encrypted_hash,
            unlock_datetime,
            request.creator_address,
            request.contract_address
        )

        logger.info(f"Successfully decrypted metadata hash: {decrypted_hash[:50]}...")
        return {"metadata_hash": decrypted_hash}

    except Exception as e:
        logger.exception(f"Failed to decrypt metadata: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decrypt metadata")


@router.get("/metrics/{address}")
async def get_metrics(address: str):
    logger.info(f"Fetching metrics for address {address}")
    try:
        now = get_utc_now()
        capsules = await Capsule.find(Capsule.creator_address == address).to_list()

        metrics = {
            "total_capsules": len(capsules),
            "locked_capsules": sum(1 for c in capsules if c.unlock_date > now),
            "unlocked_capsules": sum(1 for c in capsules if c.unlock_date <= now),
            "earliest_unlock": min((c.unlock_date for c in capsules), default=None),
            "latest_unlock": max((c.unlock_date for c in capsules), default=None)
        }

        logger.info(f"Metrics for {address}: {metrics}")
        return metrics

    except Exception as e:
        logger.exception(f"Failed to fetch metrics for {address}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch metrics")


@router.post("/track")
async def track_capsule(request: TrackCapsuleRequest):
    logger.info(f"Tracking capsule for {request.address} with token {request.token_id} #{request.serial_number}")
    try:
        # Find the most recent untracked capsule for this address
        capsule = await Capsule.find_one(
            Capsule.creator_address == request.address,
            Capsule.token_id == None,
            sort=[("created_at", -1)]  # Get the most recent one
        )
        if not capsule:
            logger.warning(f"No untracked capsule found for {request.address}")
            raise HTTPException(status_code=404, detail="Capsule not found")

        capsule.token_id = request.token_id
        capsule.serial_number = request.serial_number
        await capsule.save()

        logger.info(f"Successfully tracked capsule {str(capsule.id)} with token {request.token_id} #{request.serial_number}")
        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to track capsule: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track capsule")
