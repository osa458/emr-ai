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

# Wait for Medplum to be ready
echo ""
echo "⏳ Waiting for Medplum FHIR server to start..."
echo "   (This may take 1-2 minutes on first run)"

MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:8103/healthcheck > /dev/null 2>&1; then
        echo "✅ Medplum is ready"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
    echo -n "."
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo "⚠️  Medplum did not start in time. It may still be initializing."
    echo "   Check: docker-compose logs medplum"
fi

echo ""

# Generate Prisma client
echo "🗃️  Generating Prisma client..."
pnpm db:generate

echo ""

# Seed FHIR data (optional - may fail if Medplum isn't fully ready)
echo "🌱 Seeding synthetic patient data..."
echo "   (If this fails, run 'pnpm seed' manually after Medplum is fully started)"
pnpm seed || echo "   Seeding deferred - run 'pnpm seed' when ready"

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
