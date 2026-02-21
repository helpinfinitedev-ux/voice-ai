import os
import certifi
from pymongo import MongoClient

MONGODB_URL = os.getenv('MONGODB_URL')
DB_ENVIRONMENT = os.getenv('DB_ENVIRONMENT')

def get_database():
   client = MongoClient(MONGODB_URL, tlsCAFile=certifi.where())

   return client[str(DB_ENVIRONMENT)]