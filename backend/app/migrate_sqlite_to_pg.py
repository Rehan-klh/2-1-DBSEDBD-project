"""
Migration Script: SQLite (hostel_mess.db) -> PostgreSQL (hostel_db)
Transfers all 13 relational tables preserving IDs, foreign keys, and timestamps,
then resynchronizes all PostgreSQL auto-increment sequences.
Does NOT delete hostel_mess.db.
"""

import os
import sys
import sqlite3
from datetime import datetime, date, time
from pathlib import Path
from sqlalchemy import text

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database import engine, Base
import backend.app.models  # Ensures all model tables are registered in Base

TABLES_ORDER = [
    ("hostels", "hostel_id"),
    ("users", "user_id"),
    ("mess_menu", "menu_id"),
    ("hostel_blocks", "block_id"),
    ("announcements", "announcement_id"),
    ("students", "student_id"),
    ("rooms", "room_id"),
    ("room_allocations", "allocation_id"),
    ("leave_requests", "leave_id"),
    ("complaints", "complaint_id"),
    ("fees", "fee_id"),
    ("visitor_requests", "visitor_request_id"),
    ("room_change_requests", "request_id"),
]

def parse_val(col_name: str, val):
    if val is None:
        return None
    if isinstance(val, str):
        # Date fields
        if col_name in ("from_date", "to_date", "due_date", "visit_date"):
            try:
                return date.fromisoformat(val[:10])
            except Exception:
                return val
        # Time fields
        if col_name in ("entry_time", "exit_time"):
            try:
                return time.fromisoformat(val)
            except Exception:
                return val
        # DateTime fields
        if col_name in ("created_at", "updated_at", "allocated_at", "released_at", "published_at", "expires_at"):
            try:
                return datetime.fromisoformat(val)
            except Exception:
                return val
    return val

def migrate():
    sqlite_path = PROJECT_ROOT / "hostel_mess.db"
    if not sqlite_path.exists():
        raise FileNotFoundError(f"SQLite source database not found at: {sqlite_path}")

    print(f"[*] Reading source SQLite database: {sqlite_path}")
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    # Step 1: Ensure all 13 PostgreSQL tables exist
    print("[*] Ensuring PostgreSQL schema exists...")
    Base.metadata.create_all(bind=engine)

    # Step 2: Migrate data table by table
    with engine.begin() as pg_conn:
        for table_name, pk_col in TABLES_ORDER:
            # Check existing PG count
            pg_existing_count = pg_conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            
            # Fetch all rows from SQLite
            sqlite_cur.execute(f"SELECT * FROM {table_name}")
            rows = sqlite_cur.fetchall()
            col_names = [d[0] for d in sqlite_cur.description]

            if pg_existing_count == 0 and rows:
                print(f"[*] Migrating {len(rows)} rows for '{table_name}'...")
                cols_str = ", ".join(f'"{c}"' for c in col_names)
                params_str = ", ".join(f":{c}" for c in col_names)
                insert_stmt = text(f'INSERT INTO {table_name} ({cols_str}) VALUES ({params_str})')

                for r in rows:
                    row_dict = {}
                    for c in col_names:
                        row_dict[c] = parse_val(c, r[c])
                    pg_conn.execute(insert_stmt, row_dict)
            else:
                print(f"[i] Table '{table_name}' already contains {pg_existing_count} rows in PostgreSQL (skipped duplicate insert).")

            # Step 3: Resynchronize PostgreSQL auto-increment sequence for PK
            seq_reset_query = text(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table_name}', '{pk_col}'),
                    COALESCE((SELECT MAX({pk_col}) FROM {table_name}), 1),
                    true
                );
            """)
            try:
                pg_conn.execute(seq_reset_query)
            except Exception as e:
                print(f"[!] Warning resetting sequence for {table_name}.{pk_col}: {e}")

    sqlite_conn.close()

    # Step 4: Verification
    print("\n" + "=" * 55)
    print("        MIGRATION VERIFICATION (SQLite -> PostgreSQL)")
    print("=" * 55)
    print(f"{'Table Name':<25} | {'SQLite Count':<12} | {'PostgreSQL Count':<16}")
    print("-" * 55)

    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_cur = sqlite_conn.cursor()
    mismatch = False

    with engine.connect() as pg_conn:
        for table_name, _ in TABLES_ORDER:
            s_count = sqlite_cur.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            p_count = pg_conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            status = "OK" if s_count == p_count else "MISMATCH!"
            if s_count != p_count:
                mismatch = True
            print(f"{table_name:<25} | {s_count:<12} | {p_count:<16} {status}")

    sqlite_conn.close()
    print("=" * 55)

    if mismatch:
        raise RuntimeError("Migration verification failed: row counts do not match between SQLite and PostgreSQL.")
    else:
        print("[SUCCESS] All 13 relational tables successfully migrated with exact row counts!\n")

if __name__ == "__main__":
    migrate()
