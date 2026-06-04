from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """ Application Settings """

    app_name: str = "Capsula"
    debug: bool = True

    # Security
    secret_key: str

    # logging config
    log_file_path: str = "app.log"
    log_file_max_size: int = 5 * 1024 * 1024
    log_file_backup_count: int = 5

    # browser config
    cors_allow_origins: list[str] = [
        "http://localhost:5173",
        "https://capsula.builtbytim.dev/"
    ]
    frontend_url: str = "http://localhost:5173"

    # database config
    db_url: str = "mongodb://localhost:27017/capsula"

    # IPFS config
    ipfs_project_id: str
    ipfs_project_secret: str
    ipfs_gateway: str = "https://ipfs.infura.io"

    # Hedera contract config
    hedera_capsula_address: str

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


@lru_cache()
def get_settings():
    return Settings()
