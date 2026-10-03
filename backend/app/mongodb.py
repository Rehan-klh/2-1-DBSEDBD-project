import datetime
import logging
from typing import Any, Dict, List, Optional
import urllib.parse
from pymongo import MongoClient
from backend.app.config import settings, is_testing_environment

logger = logging.getLogger(__name__)

def normalize_mongo_uri(uri: str) -> str:
    """URL-encodes username and password according to RFC 3986 to handle @ or special characters safely."""
    if not uri or "://" not in uri or "@" not in uri:
        return uri
    try:
        scheme, rest = uri.split("://", 1)
        last_at = rest.rfind("@")
        userinfo = rest[:last_at]
        hostpart = rest[last_at + 1:]
        if ":" in userinfo:
            user, pwd = userinfo.split(":", 1)
            user_clean = urllib.parse.quote_plus(urllib.parse.unquote_plus(user))
            pwd_clean = urllib.parse.quote_plus(urllib.parse.unquote_plus(pwd))
            return f"{scheme}://{user_clean}:{pwd_clean}@{hostpart}"
    except Exception:
        pass
    return uri

class MongoManager:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.is_atlas: bool = False
        self._in_memory_notifications: List[Dict[str, Any]] = []
        self._in_memory_feedback: List[Dict[str, Any]] = []
        self._in_memory_activity_logs: List[Dict[str, Any]] = []
        self._notification_id_seq = 1
        self._feedback_id_seq = 1
        self._activity_id_seq = 1

    def connect(self):
        if settings.MONGODB_URI:
            try:
                safe_uri = normalize_mongo_uri(settings.MONGODB_URI)
                self.client = MongoClient(
                    safe_uri,
                    serverSelectionTimeoutMS=4000
                )
                # Verify connection
                self.client.admin.command('ping')
                self.db = self.client[settings.MONGODB_DB_NAME]
                self.is_atlas = True
                logger.info("[MONGODB ATLAS] Connected successfully to Atlas cluster database: %s", settings.MONGODB_DB_NAME)
                return
            except Exception as e:
                self.client = None
                self.db = None
                self.is_atlas = False
                error_msg = f"[MONGODB ATLAS ERROR] Failed to connect to MongoDB Atlas at configured MONGODB_URI: {e}"
                logger.error(error_msg)
                if not is_testing_environment():
                    raise ConnectionError(
                        f"{error_msg}. Check your MongoDB Atlas cluster URI, credentials, and network/IP whitelist in Atlas Network Access. "
                        "To run in local offline/test development mode without Atlas, leave MONGODB_URI empty."
                    )
                else:
                    logger.warning("[TEST MODE] MongoDB Atlas unreachable during test. Using in-memory fallback for test execution.")
        else:
            self.is_atlas = False
            logger.info("[STORAGE MODE: IN-MEMORY FALLBACK] No MONGODB_URI provided. Running in development/testing mode with ephemeral in-memory collections.")

    # --- Notifications ---
    def create_notification(self, user_id: int, title: str, message: str, type_: str = "GENERAL") -> Dict[str, Any]:
        doc = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type_,
            "is_read": False,
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        if self.db is not None:
            try:
                res = self.db.notifications.insert_one(doc)
                doc["_id"] = str(res.inserted_id)
                return doc
            except Exception as e:
                logger.error(f"Error inserting notification in MongoDB: {e}")
        doc["_id"] = str(self._notification_id_seq)
        self._notification_id_seq += 1
        self._in_memory_notifications.insert(0, doc)
        return doc

    def get_notifications(self, user_id: int) -> List[Dict[str, Any]]:
        if self.db is not None:
            try:
                cursor = self.db.notifications.find({"user_id": user_id}).sort("created_at", -1)
                docs = []
                for item in cursor:
                    item["_id"] = str(item["_id"])
                    docs.append(item)
                return docs
            except Exception as e:
                logger.error(f"Error fetching notifications from MongoDB: {e}")
        return [n for n in self._in_memory_notifications if n.get("user_id") == user_id]

    def mark_notification_read(self, notification_id: str, user_id: int) -> bool:
        if self.db is not None:
            try:
                from bson.objectid import ObjectId
                try:
                    query = {"_id": ObjectId(notification_id), "user_id": user_id}
                except Exception:
                    query = {"_id": notification_id, "user_id": user_id}
                res = self.db.notifications.update_one(query, {"$set": {"is_read": True}})
                return res.modified_count > 0 or res.matched_count > 0
            except Exception as e:
                logger.error(f"Error updating notification in MongoDB: {e}")
        for n in self._in_memory_notifications:
            if str(n.get("_id")) == str(notification_id) and n.get("user_id") == user_id:
                n["is_read"] = True
                return True
        return False

    # --- Mess Feedback ---
    def create_mess_feedback(self, student_id: int, meal_type: str, date: str, rating: int, feedback: str) -> Dict[str, Any]:
        doc = {
            "student_id": student_id,
            "meal_type": meal_type,
            "date": date,
            "rating": rating,
            "feedback": feedback,
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        if self.db is not None:
            try:
                res = self.db.mess_feedback.insert_one(doc)
                doc["_id"] = str(res.inserted_id)
                return doc
            except Exception as e:
                logger.error(f"Error inserting mess feedback in MongoDB: {e}")
        doc["_id"] = str(self._feedback_id_seq)
        self._feedback_id_seq += 1
        self._in_memory_feedback.insert(0, doc)
        return doc

    def get_student_mess_feedback(self, student_id: int) -> List[Dict[str, Any]]:
        if self.db is not None:
            try:
                cursor = self.db.mess_feedback.find({"student_id": student_id}).sort("created_at", -1)
                docs = []
                for item in cursor:
                    item["_id"] = str(item["_id"])
                    docs.append(item)
                return docs
            except Exception as e:
                logger.error(f"Error fetching mess feedback from MongoDB: {e}")
        return [f for f in self._in_memory_feedback if f.get("student_id") == student_id]

    def get_all_mess_feedback(self) -> List[Dict[str, Any]]:
        if self.db is not None:
            try:
                cursor = self.db.mess_feedback.find().sort("created_at", -1)
                docs = []
                for item in cursor:
                    item["_id"] = str(item["_id"])
                    docs.append(item)
                return docs
            except Exception as e:
                logger.error(f"Error fetching all mess feedback from MongoDB: {e}")
        return list(self._in_memory_feedback)

    # --- Activity Logs ---
    def log_activity(self, user_id: int, role: str, action: str, entity: str, entity_id: Optional[int] = None, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        doc = {
            "user_id": user_id,
            "role": role,
            "action": action,
            "entity": entity,
            "entity_id": entity_id,
            "details": details or {},
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        if self.db is not None:
            try:
                res = self.db.activity_logs.insert_one(doc)
                doc["_id"] = str(res.inserted_id)
                return doc
            except Exception as e:
                logger.error(f"Error inserting activity log in MongoDB: {e}")
        doc["_id"] = str(self._activity_id_seq)
        self._activity_id_seq += 1
        self._in_memory_activity_logs.insert(0, doc)
        return doc

    def get_activity_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        if self.db is not None:
            try:
                cursor = self.db.activity_logs.find().sort("timestamp", -1).limit(limit)
                docs = []
                for item in cursor:
                    item["_id"] = str(item["_id"])
                    docs.append(item)
                return docs
            except Exception as e:
                logger.error(f"Error fetching activity logs from MongoDB: {e}")
        return self._in_memory_activity_logs[:limit]

mongo_db = MongoManager()
