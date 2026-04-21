#!/bin/bash

# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rubiesfamily@gmail.com","password":"$RUbway26"}' | jq -r '.access_token')

echo "Token: ${TOKEN:0:30}..."

# Create a test file
echo "Test audio content" > /tmp/test_audio.mp3

# Test upload
curl -X POST http://localhost:3000/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_audio.mp3" \
  -F "mediaType=audio" \
  -v

rm /tmp/test_audio.mp3
