#!/bin/bash

# Database setup script for Fukuneko App

echo "🐱 Setting up Fukuneko Database..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) is not installed"
    echo "Please install PostgreSQL or use Supabase Dashboard to run the schema"
    exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
else
    echo "❌ .env.local file not found"
    echo "Please create .env.local with DATABASE_URL"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.local"
    exit 1
fi

echo "📊 Running database schema..."
psql "$DATABASE_URL" -f database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo "🚀 You can now run: npm run dev"
else
    echo "❌ Database setup failed"
    echo "Please check your DATABASE_URL and try again"
    exit 1
fi
