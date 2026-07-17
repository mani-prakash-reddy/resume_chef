from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from config import settings

security = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: Optional[str] = None


jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json" if settings.supabase_url else ""
jwks_client = jwt.PyJWKClient(jwks_url) if jwks_url else None

def _decode_supabase_token(token: str) -> dict:
    try:
        if jwks_client:
            try:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                return jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["HS256", "RS256", "ES256"],
                    audience="authenticated",
                )
            except jwt.PyJWKClientError:
                pass  # Fallback to symmetric key
        
        # Fallback to symmetric secret for legacy tokens
        if not settings.supabase_jwt_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase JWT secret is not configured and JWKS failed",
            )
        
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256", "RS256", "ES256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AuthUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = _decode_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return AuthUser(
        id=user_id,
        email=payload.get("email"),
        role=payload.get("role"),
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[AuthUser]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
