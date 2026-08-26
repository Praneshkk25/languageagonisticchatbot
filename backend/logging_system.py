from database import db
import datetime

def sanitize_utf8(val):
    if isinstance(val, str):
        return val.encode("utf-8", errors="replace").decode("utf-8", errors="ignore")
    elif isinstance(val, dict):
        return {sanitize_utf8(k): sanitize_utf8(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [sanitize_utf8(item) for item in val]
    return val

class SystemLogger:
    def log(self, user_id: str, action: str, details: str):
        try:
            safe_user = sanitize_utf8(str(user_id or "SYSTEM"))
            safe_action = sanitize_utf8(str(action or "LOG"))
            safe_details = sanitize_utf8(str(details or ""))

            log_entry = {
                "user_id": safe_user,
                "action_type": safe_action,
                "details": safe_details,
                "timestamp": datetime.datetime.utcnow()
            }
            try:
                db.collection("activity_logs").add(log_entry)
            except Exception as dbe:
                pass
            
            try:
                print(f"[LOG] {safe_user} - {safe_action}: {safe_details[:300]}")
            except Exception:
                safe_ascii = safe_details.encode("ascii", errors="replace").decode("ascii")
                print(f"[LOG] {safe_user} - {safe_action}: {safe_ascii[:300]}")
        except Exception as e:
            print(f"[LOG ERROR] {e}")

logger = SystemLogger()
