from dotenv import load_dotenv

load_dotenv()

from src.calendly.worker import fetch_and_update_availability_schedule

fetch_and_update_availability_schedule()