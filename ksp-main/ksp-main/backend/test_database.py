from pathlib import Path
import sys
import logging

# Ensure backend directory is in path to import database functions
sys.path.append(str(Path(__file__).parent))
from database import execute_query

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def test_database():
    """
    Tests the database connection, prints top 10 records,
    total count, and runs a sample SQL query.
    """
    print("=== Testing Database Connection ===")
    
    try:
        # 1. Print the first 10 records
        print("\n--- First 10 Records ---")
        query_top10 = "SELECT * FROM CrimeStatistics LIMIT 10"
        rows = execute_query(query_top10)
        
        if not rows:
            print("No records found in CrimeStatistics.")
            return
            
        # Extract column names from the first row and print header
        columns = rows[0].keys()
        print(" | ".join(columns))
        print("-" * 80)
        
        for row in rows:
            print(" | ".join([str(row[col]) for col in columns]))
            
        # 2. Print total row count
        print("\n--- Total Row Count ---")
        query_count = "SELECT COUNT(*) as count FROM CrimeStatistics"
        count_result = execute_query(query_count)
        
        if count_result:
            total_rows = count_result[0]['count']
            print(f"Total rows in database: {total_rows}")
        
        # 3. Run a sample SQL query: Show Murder statistics for January 2026
        print("\n--- Sample Query: Murder statistics for January 2026 ---")
        
        # 1. Print the SQLite table schema using PRAGMA
        print("\n--- Schema Information ---")
        schema_query = "PRAGMA table_info(CrimeStatistics);"
        schema_rows = execute_query(schema_query)
        for r in schema_rows:
            print(f"Column: {r['name']}, Type: {r['type']}")
            
        print("\n--- Parameterized Query Execution ---")
        query_sample = """
            SELECT Year, Subcategory, Cases 
            FROM CrimeStatistics 
            WHERE Crime_Category = ? 
              AND Month = ? 
              AND Year = ?
        """
        params = ('Murder', 'January', '2026')
        
        print("SQL query:")
        print(query_sample.strip())
        print(f"Parameters: {params}")
        
        sample_results = execute_query(query_sample, params)
        
        print("\nReturned rows:")
        if sample_results:
            for row in sample_results:
                print(f"Year: {row['Year']} | {row['Subcategory']}: {row['Cases']} cases")
        else:
            print("No data found.")
            
        print("\nDatabase testing completed successfully.")
        
    except Exception as e:
        logging.error(f"Test failed: {e}")

if __name__ == "__main__":
    test_database()
