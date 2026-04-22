# ── Stage 1: base image ────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

# Keep Python from buffering stdout/stderr and from generating .pyc files
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── Stage 2: install dependencies ──────────────────────────────────────────────
FROM base AS deps

# Install only what pip needs to compile wheels (none needed here, but kept
# as a good pattern for future packages with C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ── Stage 3: final runtime image ───────────────────────────────────────────────
FROM base AS final

# Copy installed packages from the deps stage
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy the entire backend source (templates, static files, modules, etc.)
COPY backend/ .

# The app reads config from a .env file; mount yours at runtime or pass
# environment variables directly with  -e / --env-file  in docker run.
# The Firebase service-account JSON should also be provided at runtime
# (e.g. via a bind-mount or Docker secret) and its path set in
# GOOGLE_APPLICATION_CREDENTIALS.

EXPOSE 8000

# Use uvicorn directly (not reload=True, which is for development only)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
