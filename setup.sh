#!/bin/bash

echo "🎬 Media Streamer Setup Script"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ docker-compose is installed"
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p media/{videos,audio,uploads}
touch media/videos/.gitkeep media/audio/.gitkeep

echo "✅ Directory structure created"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created (you can customize it)"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "🚀 Setup Options:"
echo ""
echo "1. Start with Docker Compose (Recommended)"
echo "   docker-compose up -d"
echo ""
echo "2. Start with Node.js"
echo "   npm install && npm start"
echo ""
echo "3. Build and run with Docker manually"
echo "   docker build -t media-streamer ."
echo "   docker run -d -p 3000:3000 -v \$(pwd)/media:/app/media media-streamer"
echo ""
echo "📖 After starting, access the app at: http://localhost:3000"
echo ""
echo "✨ Setup complete!"
