# Base image: lightweight Python
FROM python:3.12-slim       # Use official lightweight Python image

# Set working directory
WORKDIR /app                 # All commands run in /app inside the container

# Copy project files into container
COPY . .                     # Copy everything from current folder into /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt   # Install Python libs

# Expose port
EXPOSE 8000                  # Tell Docker the app runs on 8000

# Run the app
CMD ["python", "app.py"]     # Start the app when container runs