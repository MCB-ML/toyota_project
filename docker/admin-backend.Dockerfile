FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY admin/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY admin/backend/ ./

EXPOSE 8080

CMD ["python", "cmd/main.py"]