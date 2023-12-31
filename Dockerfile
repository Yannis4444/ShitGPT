FROM python:3.11-alpine

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py ./
COPY templates/ templates/
COPY static/ static/
COPY modes.json .

ENV OPENAI_API_KEY="your_key"

EXPOSE 80

CMD ["python", "main.py"]