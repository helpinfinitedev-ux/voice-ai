FROM python:3.11

WORKDIR /app

# COPY .env /app
COPY src/ /app/src/

RUN pip install "fastapi[all]==0.110.0" twilio==9.0.0 retell-sdk==3.6.0 "pymongo[srv]==4.6.2" pydantic==2.6.3 \
    requests==2.31.0 python-dotenv==1.0.1 openai==1.13.3 rq==1.16.1 pytz==2024.1 generateApiKey==0.4.7 anthropic==0.25.3

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000"]