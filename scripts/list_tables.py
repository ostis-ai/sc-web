import sqlite3

db_path = '../data.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in database:")
    for table in tables:
        print(table[0])
except Exception as e:
    print(f'Error: {e}')
finally:
    if 'conn' in locals() and conn:
        conn.close()
