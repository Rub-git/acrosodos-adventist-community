#!/bin/bash

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rubiesfamily@gmail.com","password":"$RUbway26"}' \
  | jq -r '.access_token')

echo "Token: ${TOKEN:0:20}..."

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Failed to get token"
  exit 1
fi

# Create a small test file
echo "Creating test file..."
dd if=/dev/zero of=/tmp/test_upload.dat bs=1M count=1 2>/dev/null

# Upload test file
echo "Uploading test file..."
curl -X POST http://localhost:3000/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_upload.dat" \
  -F "mediaType=video"

echo ""
echo "Done!"
