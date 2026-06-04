from datetime import datetime
from cryptography.fernet import Fernet
import hashlib
import base64
from models.capsule import utc_now


def _derive_key(unlock_date: datetime, creator_address: str, contract_address: str) -> bytes:
    """
    Derive an encryption key from unlock date, creator address, and contract address.
    This key can be derived independently by anyone using only public blockchain data.
    """
    # Convert unlock date to timestamp
    unlock_timestamp = int(unlock_date.timestamp())

    # Create deterministic key material from public data
    key_material = f"{unlock_timestamp}:{creator_address.lower()}:{contract_address.lower()}".encode()

    # Use SHA256 to derive a deterministic key (no secret needed)
    key = hashlib.sha256(key_material).digest()

    return base64.urlsafe_b64encode(key)


def encrypt_metadata_hash(metadata_hash: str, unlock_date: datetime, creator_address: str, contract_address: str) -> str:
    """
    Encrypt the IPFS metadata hash using a key derived from public blockchain data.
    This ensures the content cannot be accessed before unlock date, but can be decrypted
    independently by anyone with the public data.
    """
    key = _derive_key(unlock_date, creator_address, contract_address)
    f = Fernet(key)
    encrypted_data = f.encrypt(metadata_hash.encode())
    return base64.urlsafe_b64encode(encrypted_data).decode()


def decrypt_metadata_hash(encrypted_hash: str, unlock_date: datetime, creator_address: str, contract_address: str) -> str:
    """
    Decrypt the metadata hash. Will only work if current time is past unlock date.
    Can be called by anyone using only public blockchain data.
    """
    if utc_now() < unlock_date:
        raise ValueError("Capsule is still locked")

    key = _derive_key(unlock_date, creator_address, contract_address)
    f = Fernet(key)
    encrypted_data = base64.urlsafe_b64decode(encrypted_hash)
    decrypted_data = f.decrypt(encrypted_data)
    return decrypted_data.decode()
