FROM python:3.14-slim

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


# Run as a non-root user. Nothing here needs root: the app binds 8000, which is above the
# privileged range, and writes nothing outside the uploads volume.
RUN useradd --system --uid 1001 --create-home --home-dir /home/app app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Run FastAPI app
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
