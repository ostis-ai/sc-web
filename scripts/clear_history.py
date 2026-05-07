import sqlite3
import os

db_path = '../data.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM history')
    conn.commit()
    print(f'Successfully cleared history table in {db_path}')
except Exception as e:
    print(f'Error clearing history: {e}')
finally:
    if 'conn' in locals() and conn:
        conn.close()
