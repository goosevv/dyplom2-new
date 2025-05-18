from functools import wraps
from flask import abort
from flask_jwt_extended import get_jwt_identity
from models.models import User

def role_required(*allowed):
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            user = User.query.get(get_jwt_identity())
            if not user or user.role.name not in allowed:
                abort(403, description="Недостаточно прав")
            return fn(*args, **kwargs)
        return decorated
    return wrapper

