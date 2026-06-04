from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from models.capsule import CapsuleDB, CapsuleMetrics


class Database:
    client: AsyncIOMotorClient = None
    capsules_collection = None

    async def connect(self, mongodb_url: str, db_name: str):
        self.client = AsyncIOMotorClient(mongodb_url)
        db = self.client[db_name]
        self.capsules_collection = db.capsules

        # Create indexes
        await self.capsules_collection.create_index("creator_address")
        await self.capsules_collection.create_index("unlock_date")
        await self.capsules_collection.create_index([("token_id", 1), ("serial_number", 1)], unique=True)

    async def close(self):
        if self.client:
            self.client.close()

    async def create_capsule(self, capsule: CapsuleDB) -> str:
        result = await self.capsules_collection.insert_one(capsule.dict(by_alias=True))
        return str(result.inserted_id)

    async def get_capsule(self, token_id: str, serial_number: str) -> Optional[CapsuleDB]:
        result = await self.capsules_collection.find_one({
            "token_id": token_id,
            "serial_number": serial_number
        })
        return CapsuleDB(**result) if result else None

    async def update_capsule_token(self, capsule_id: str, token_id: str, serial_number: str) -> bool:
        result = await self.capsules_collection.update_one(
            {"_id": capsule_id},
            {
                "$set": {
                    "token_id": token_id,
                    "serial_number": serial_number,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    async def get_user_capsules(self, address: str) -> List[CapsuleDB]:
        cursor = self.capsules_collection.find({"creator_address": address})
        return [CapsuleDB(**doc) async for doc in cursor]

    async def get_user_metrics(self, address: str) -> CapsuleMetrics:
        now = datetime.utcnow()
        pipeline = [
            {"$match": {"creator_address": address}},
            {
                "$group": {
                    "_id": None,
                    "total_capsules": {"$sum": 1},
                    "locked_capsules": {
                        "$sum": {"$cond": [{"$gt": ["$unlock_date", now]}, 1, 0]}
                    },
                    "unlocked_capsules": {
                        "$sum": {"$cond": [{"$lte": ["$unlock_date", now]}, 1, 0]}
                    },
                    "earliest_unlock": {"$min": "$unlock_date"},
                    "latest_unlock": {"$max": "$unlock_date"}
                }
            }
        ]

        result = await self.capsules_collection.aggregate(pipeline).to_list(1)
        if not result:
            return CapsuleMetrics()

        metrics = result[0]
        return CapsuleMetrics(
            total_capsules=metrics["total_capsules"],
            locked_capsules=metrics["locked_capsules"],
            unlocked_capsules=metrics["unlocked_capsules"],
            earliest_unlock=metrics["earliest_unlock"],
            latest_unlock=metrics["latest_unlock"]
        )


db = Database()
