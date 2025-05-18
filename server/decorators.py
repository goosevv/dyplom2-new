from functools import wraps
from flask import abort
from flask_jwt_extended import get_jwt_identity
from models.models import User

def role_required(*allowed_roles):
    """
    Декоратор: доступ только для пользователей с role в allowed_roles.
    Примеры: @role_required("admin"), @role_required("content_manager", "admin")
    """
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.role not in allowed_roles:
                abort(403, description="Недостаточно прав для выполнения действия")
            return fn(*args, **kwargs)
        return decorated
    return wrapper
