FROM python:3.12-slim

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and assets
COPY main.py .
COPY auth.py .
COPY pb_client.py .
COPY utils/ utils/
COPY static/ static/
COPY templates/ templates/


# Expose port
EXPOSE 8000

# Run FastAPI app
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
