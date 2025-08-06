import os
from redis import Redis

REDIS_HOST = os.getenv('REDIS_HOST')
REDIS_PORT = os.getenv('REDIS_PORT')
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')

def get_redis():
    return Redis(host=REDIS_HOST, port=int(REDIS_PORT), password=REDIS_PASSWORD)
