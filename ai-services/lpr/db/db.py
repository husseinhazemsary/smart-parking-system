import os
from dotenv import load_dotenv
import psycopg2

# Load environment variables from .env file
load_dotenv()

# Database connection parameters
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "ocr_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432")
}

GATE_ID = "b67456c7-7e78-4d42-a339-acd0bab9bb20"


def check_access(plate_text):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT decision, reason
        FROM check_and_log_access(%s, %s);
        """,
        (GATE_ID, plate_text)
    )

    decision, reason = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    return decision, reason
