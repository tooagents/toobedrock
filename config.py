# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class _Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env",env_file_encoding="utf-8",extra="ignore",)

    REGION: str = "us-east-1"
    CLIENT_ID: str = ""
    CLIENT_SECRET: str = ""
    SCOPE: str = ""
    DISCOVERY_URL: str = ""
    ROLE_ARN: str = ""
    USER_POOL_ID: str = ""
    

    GATEWAY_ID: str = ""
    GATEWAY_URL: str = ""
    
    NASA_API_KEY: str = ""        
    NASA_API_ARN: str = ""
    S3_URI: str = ""
    
    
    AK_ID: str = ""
    AK_SECRET: str = ""
    # MODEL_ID: str = "amazon.nova-lite-v1:0"
    MODEL_ID: str = "amazon.nova-micro-v1:0"
    
    
@lru_cache()
def get_settings_singleton()-> _Settings:
    return _Settings()

