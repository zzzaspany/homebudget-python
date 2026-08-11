import os
from fastapi import Request, HTTPException, status
from pydantic import BaseModel

class UserProfile(BaseModel):
    username: str
    name: str
    email: str

def get_current_user(request: Request) -> UserProfile:
    dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
    
    # Log incoming headers (excluding sensitive tokens/cookies)
    safe_headers = {k: v for k, v in request.headers.items() if k.lower() not in ["cookie", "authorization", "proxy-authorization"]}
    print(f"SSO DEBUG: Received headers: {safe_headers}")
    
    # Try common SSO/ForwardAuth header variants
    username = request.headers.get("Remote-User") or request.headers.get("X-Forwarded-User") or request.headers.get("X-Auth-User")
    name = request.headers.get("Remote-Name") or request.headers.get("X-Forwarded-Name") or request.headers.get("X-Auth-Name")
    email = request.headers.get("Remote-Email") or request.headers.get("X-Forwarded-Email") or request.headers.get("X-Auth-Email")
    
    if not username:
        if dev_mode:
            return UserProfile(
                username="konrad",
                name="Konrad Zielinski",
                email="konrad124@gmail.com"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Missing Authelia SSO authentication headers. Received headers: {list(safe_headers.keys())}"
            )
            
    return UserProfile(
        username=username,
        name=name or username,
        email=email or f"{username}@office.lab"
    )
