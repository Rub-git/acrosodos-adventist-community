#!/bin/bash

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rubiesfamily@gmail.com","password":"$RUbway26"}' \
  | grep -o '"access_token":"[^"]*"' \
  | cut -d'"' -f4)

echo "Token: ${TOKEN:0:20}..."

# Create a small test video file
ffmpeg -f lavfi -i testsrc=duration=2:size=320x240:rate=30 -f lavfi -i sine=frequency=1000:duration=2 \
  -c:v libx264 -pix_fmt yuv420p -c:a aac /tmp/test_video.mp4 2>/dev/null

# Upload test video
echo "Uploading test video..."
curl -v -X POST http://localhost:3000/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_video.mp4" \
  -F "mediaType=video" \
  2>&1 | grep -A 5 -B 5 "HTTP\|fileUrl\|error"

