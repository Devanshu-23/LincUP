# import this in main.py or anywhere you want to make a connection with the lincup database and use the fnc  get_db and then you can uset he db  
from contextlib import contextmanager
import os
import sqlite3


DATABASE =  "../db/lincup.db"

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # can use column names as indexes after executing queries, so will not have check indexes everytime
    # cursor = conn.cursor()

    try: 
        yield conn # new thing i learned, can use yield to like pause the execution and also returning the value but when the connection not needed will come back here, kind of like sleep wait
        # or we can just return conn and close it everytime specifically wherever it was returned, will have to check its usage first
    finally:
        conn.close()
