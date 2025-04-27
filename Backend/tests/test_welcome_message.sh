#!/bin/bash

# Base URL for the API
BASE_URL="http://localhost:8000"

# Utility function to check HTTP status
check_status() {
    local response=$1
    local endpoint=$2
    if echo "$response" | jq -e '.detail' >/dev/null 2>&1; then
        echo "Error: $endpoint failed: $response"
        exit 1
    fi
}

# Generate a unique suffix for the test
UNIQUE_SUFFIX=$(uuidgen | tr -d '-' | cut -c 1-32)

# Step 1: Create a new user
echo "Creating user testuser_$UNIQUE_SUFFIX..."
CREATE_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test_$UNIQUE_SUFFIX@example.com\",\"username\":\"testuser_$UNIQUE_SUFFIX\",\"password\":\"password123\"}")
echo "Response: $CREATE_USER_RESPONSE"
check_status "$CREATE_USER_RESPONSE" "POST /api/users/"
USER_ID=$(echo "$CREATE_USER_RESPONSE" | jq -r '.id')
if [[ -z "$USER_ID" || "$USER_ID" == "null" ]]; then
    echo "Error: User ID missing: $CREATE_USER_RESPONSE"
    exit 1
fi
echo "User created: ID=$USER_ID"

# Step 2: Log in
echo "Logging in as testuser_$UNIQUE_SUFFIX..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"testuser_$UNIQUE_SUFFIX\",\"password\":\"password123\"}")
echo "Response: $LOGIN_RESPONSE"
check_status "$LOGIN_RESPONSE" "POST /api/users/login"
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
if [[ -z "$ACCESS_TOKEN" || "$ACCESS_TOKEN" == "null" ]]; then
    echo "Error: Access token missing: $LOGIN_RESPONSE"
    exit 1
fi
echo "Logged in: Access Token=$ACCESS_TOKEN"

# Step 3: Create a public room
echo "Creating public room 'TestRoom_$UNIQUE_SUFFIX'..."
CREATE_ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/public" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{\"name\":\"TestRoom_$UNIQUE_SUFFIX\"}")
echo "Response: $CREATE_ROOM_RESPONSE"
check_status "$CREATE_ROOM_RESPONSE" "POST /api/rooms/public"
ROOM_ID=$(echo "$CREATE_ROOM_RESPONSE" | jq -r '.id')
ROOM_NAME=$(echo "$CREATE_ROOM_RESPONSE" | jq -r '.name')
if [[ -z "$ROOM_ID" || "$ROOM_ID" == "null" ]]; then
    echo "Error: Room ID missing: $CREATE_ROOM_RESPONSE"
    exit 1
fi
echo "Public room created: ID=$ROOM_ID, Name=$ROOM_NAME"

# Step 4: Join the public room
echo "Joining public room ID=$ROOM_ID..."
JOIN_ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/public/join/$ROOM_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $JOIN_ROOM_RESPONSE"
check_status "$JOIN_ROOM_RESPONSE" "POST /api/rooms/public/join/$ROOM_ID"
JOINED_ROOM_ID=$(echo "$JOIN_ROOM_RESPONSE" | jq -r '.id')
if [[ "$JOINED_ROOM_ID" != "$ROOM_ID" ]]; then
    echo "Error: Joined room ID does not match: $JOIN_ROOM_RESPONSE"
    exit 1
fi
echo "Joined room: ID=$ROOM_ID"

# Step 5: Check for welcome message
echo "Checking for welcome message in room ID=$ROOM_ID..."
MESSAGES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/messages/room/$ROOM_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $MESSAGES_RESPONSE"
check_status "$MESSAGES_RESPONSE" "GET /api/messages/room/$ROOM_ID"
WELCOME_MESSAGE=$(echo "$MESSAGES_RESPONSE" | jq -r '.[] | select(.content == "Welcome to the '"$ROOM_NAME"'")')
if [[ -z "$WELCOME_MESSAGE" ]]; then
    echo "Error: Welcome message not found: $MESSAGES_RESPONSE"
    exit 1
fi
WELCOME_MESSAGE_ID=$(echo "$WELCOME_MESSAGE" | jq -r '.id')
echo "Welcome message found: ID=$WELCOME_MESSAGE_ID, Content='Welcome to the $ROOM_NAME'"

# Step 6: Reply with 'thankyou'
echo "Sending 'thankyou' message to room ID=$ROOM_ID..."
REPLY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/messages/" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{\"room_id\":$ROOM_ID,\"content\":\"thankyou\"}")
echo "Response: $REPLY_RESPONSE"
check_status "$REPLY_RESPONSE" "POST /api/messages/"
REPLY_MESSAGE_ID=$(echo "$REPLY_RESPONSE" | jq -r '.id')
if [[ -z "$REPLY_MESSAGE_ID" || "$REPLY_MESSAGE_ID" == "null" ]]; then
    echo "Error: Reply message ID missing: $REPLY_RESPONSE"
    exit 1
fi
echo "Reply message sent: ID=$REPLY_MESSAGE_ID, Content='thankyou'"

# Step 7: Log out
echo "Logging out..."
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/logout" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $LOGOUT_RESPONSE"
check_status "$LOGOUT_RESPONSE" "POST /api/users/logout"
LOGOUT_MESSAGE=$(echo "$LOGOUT_RESPONSE" | jq -r '.message')
if [[ "$LOGOUT_MESSAGE" != "Logged out successfully" ]]; then
    echo "Error: Logout failed: $LOGOUT_RESPONSE"
    exit 1
fi
echo "Logged out successfully"

echo "Test case completed successfully!"