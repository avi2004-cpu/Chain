#!/usr/bin/env bash
# Guided local setup order — run steps in this order, not in parallel,
# the first time any teammate sets up the project.
set -e

echo "1. Set up Fabric test-network — see fabric-network/README.md (manual step)"
echo "2. Deploy chaincode: identity, asset, access-control — see chaincode/*/README.md"
echo "3. cd backend && npm install && cp .env.example .env && npm run dev"
echo "4. cd frontend && npm install && npm run dev"
echo ""
echo "Do not skip ahead — backend needs chaincode deployed, frontend needs backend running."
