#!/bin/bash
BASE_URL="http://localhost:8001"

# 1. Register a test user
echo "Registering test user..."
REGISTER_RESPONSE=$(http POST "$BASE_URL/api/users/" \
    email="testuser_$(date +%s)@example.com" \
    username="testuser" \
    password="testpass123")
echo $REGISTER_RESPONSE
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')

# 2. Create a room
echo "Creating test room..."
ROOM_RESPONSE=$(http POST "$BASE_URL/rooms/public" \
    "Authorization: Bearer $ACCESS_TOKEN" \
    name="Test Room")
ROOM_ID=$(echo "$ROOM_RESPONSE" | jq -r '.id')
echo "Room ID: $ROOM_ID"

# 3. Test WebSocket in terminal 1:
echo "Open a new terminal and run:"
echo "wscat -c \"ws://localhost:8000/api/messages/ws/$ROOM_ID\""

# 4. Send test message in terminal 2:
echo "Then in another terminal, send a test message:"
echo "http POST \"$BASE_URL/api/messages/\" \
    \"Authorization: Bearer $ACCESS_TOKEN\" \
    room_id=$ROOM_ID content=\"Hello Pusher!\""

# 5. Verify Pusher event (install Pusher CLI):
echo "To monitor Pusher events:"
echo "npm install -g pusher-cli"
echo "pusher listen --app-id YOUR_APP_ID --key YOUR_KEY --secret YOUR_SECRET --cluster YOUR_CLUSTER"