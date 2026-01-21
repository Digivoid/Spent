FROM python:3.12

WORKDIR /app
COPY . .

# Upgrade pip and install dependencies
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8067
CMD ["python", "app.py"]
