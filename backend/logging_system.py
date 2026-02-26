from database import db
import datetime

class SystemLogger:
    def log(self, user_id: str, action: str, details: str):
        try:
            log_entry = {
                "user_id": user_id,
                "action_type": action,
                "details": details,
                "timestamp": datetime.datetime.utcnow()
            }
            db.collection("activity_logs").add(log_entry)
            print(f"[LOG] {user_id} - {action}: {details}")
        except Exception as e:
            print(f"[LOG ERROR] {e}")

logger = SystemLogger()
