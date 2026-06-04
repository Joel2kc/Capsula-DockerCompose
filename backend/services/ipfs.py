import json
from typing import Optional
import httpx
from config.settings import get_settings

settings = get_settings()


class IPFSService:
    def __init__(self):
        self.project_id = settings.ipfs_project_id
        self.project_secret = settings.ipfs_project_secret
        self.api_url = "https://ipfs.infura.io:5001/api/v0"
        self.auth = (self.project_id, self.project_secret)

    async def _upload_to_ipfs(self, data: bytes) -> str:
        """Upload raw data to IPFS"""
        async with httpx.AsyncClient() as client:
            files = {'file': data}
            response = await client.post(
                f"{self.api_url}/add",
                files=files,
                auth=self.auth
            )
            if response.status_code != 200:
                raise Exception("Failed to upload to IPFS")
            return response.json()['Hash']

    async def upload_nft_metadata(self, name: str, description: str, image_url: str,
                                  unlock_date: str, external_url: str = "https://capsula.app") -> str:
        """Upload standard NFT metadata JSON to IPFS"""
        metadata = {
            "name": name,
            "description": description,
            "image": image_url,
            "attributes": [
                {
                    "trait_type": "Unlock Date",
                    "value": unlock_date
                },
                {
                    "trait_type": "Type",
                    "value": "Time-Locked Capsule"
                }
            ],
            "external_url": external_url,
            "background_color": "000000"
        }

        metadata_bytes = json.dumps(metadata).encode()
        return await self._upload_to_ipfs(metadata_bytes)

    async def upload_private_metadata(self, message: str, unlock_date: str,
                                      media_type: Optional[str] = None,
                                      media_url: Optional[str] = None) -> str:
        """Upload private capsule metadata JSON to IPFS"""
        metadata = {
            "message": message,
            "unlockDate": unlock_date,
            "type": "time-locked-capsule-private",
            "version": "1.0.0"
        }
        if media_type:
            metadata["mediaType"] = media_type
        if media_url:
            metadata["mediaUrl"] = media_url

        metadata_bytes = json.dumps(metadata).encode()
        return await self._upload_to_ipfs(metadata_bytes)

    async def upload_file(self, file_data: bytes) -> str:
        """Upload a file to IPFS"""
        return await self._upload_to_ipfs(file_data)


ipfs = IPFSService()
