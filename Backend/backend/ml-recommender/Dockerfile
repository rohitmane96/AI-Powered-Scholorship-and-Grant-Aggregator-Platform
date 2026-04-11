FROM python:3.12-alpine

WORKDIR /app
COPY app.py /app/app.py

EXPOSE 8090

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8090/health', timeout=3)"

ENTRYPOINT ["python", "/app/app.py"]
