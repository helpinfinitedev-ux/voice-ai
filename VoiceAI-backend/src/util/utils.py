import pytz
import datetime

def is_current_time_within_range(start: str, end: str, timezone: str):
    start_tokens = start.split(":")
    end_tokens = end.split(":")

    current_timezone = pytz.timezone(timezone)

    start_time = datetime.time(int(start_tokens[0]), int(start_tokens[1]), 0, tzinfo=current_timezone)
    end_time = datetime.time(int(end_tokens[0]), int(end_tokens[1]), 0, tzinfo=current_timezone)

    current_time = datetime.datetime.now(tz=current_timezone).time()

    return start_time <= current_time <= end_time

def current_time_in_unix_timestamp():
    return int(datetime.datetime.now(tz=datetime.timezone.utc).timestamp() * 1000)

def num_of_milliseconds_in_days(num_of_days: int):
    return num_of_days * 60 * 60 * 24 * 1000

def num_of_milliseconds_in_hours(num_of_hours: int):
    return num_of_hours * 60 * 60 * 1000

def num_of_milliseconds_in_minutes(num_of_minutes: int):
    return num_of_minutes * 60 * 1000
    