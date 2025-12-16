#!/bin/bash

set -e

echo ""
echo "🏥 EMR AI - Development Setup"
echo "=============================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed."
    echo "   Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "✅ Docker found"

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is required but not installed."
    echo "   Run: npm install -g pnpm"
    exit 1
fi
echo "✅ pnpm found"

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo ""

# Copy environment file if not exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo ""
    echo "⚠️  IMPORTANT: Please update .env.local with your OpenAI API key"
    echo "   Edit the file: .env.local"
    echo "   Set: OPENAI_API_KEY=sk-your-api-key"
    echo ""
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Generate Prisma client
echo "🗃️  Generating Prisma client..."
pnpm db:generate

echo ""

# Seed data hook (no FHIR seed for Aidbox here)
echo "🌱 Skipping FHIR seed (use Aidbox data as configured)"

echo ""
echo "=============================="
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "   1. Start the development server: pnpm dev"
echo "   2. Open http://localhost:3000"
echo ""
echo "   If you haven't already, update your OpenAI API key in .env.local"
echo ""
echo "🩺 Happy coding!"
echo ""
