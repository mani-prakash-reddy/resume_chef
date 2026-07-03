# syntax=docker/dockerfile:1

# ---------- Stage 1: builder ----------
# Resolves and installs dependencies into an isolated virtualenv.
FROM python:3.12-slim AS builder

WORKDIR /src

ENV VENV_PATH=/opt/venv \
    PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# uv resolves/installs dependencies straight from pyproject.toml (no lockfile needed)
RUN pip install --no-cache-dir uv

COPY pyproject.toml /src/

RUN python -m venv $VENV_PATH && \
    uv pip install --python $VENV_PATH/bin/python --no-cache -r pyproject.toml

# ---------- Stage 2: runtime ----------
# Slim final image containing only the venv and application source.
FROM python:3.12-slim AS runtime

WORKDIR /app

ENV VENV_PATH=/opt/venv \
    PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY --from=builder /opt/venv /opt/venv
COPY . /app

# Ensure start script is executable and create non-root user
RUN chmod +x /app/startup.sh && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["./startup.sh"]
