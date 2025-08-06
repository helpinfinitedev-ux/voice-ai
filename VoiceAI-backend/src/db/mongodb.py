import os
from pymongo import MongoClient

MONGODB_URL = os.getenv('MONGODB_URL')
DB_ENVIRONMENT = os.getenv('DB_ENVIRONMENT')

def get_database():
   client = MongoClient(MONGODB_URL)

   return client[str(DB_ENVIRONMENT)]