#!/bin/bash

# Base URL
BASE_URL="http://localhost:8000"

# Generate unique username/email using UUID to avoid duplicates
UUID=$(uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]')
USERNAME="testuser_$UUID"
EMAIL="test_$UUID@example.com"

# Generate unique room names
PUBLIC_ROOM_NAME="PublicRoom_$UUID"
PRIVATE_ROOM_NAME="PrivateClub_$UUID"

# Function to check HTTP status
check_status() {
  local response=$1
  local endpoint=$2
  if ! echo "$response" | jq . > /dev/null 2>&1; then
    echo "Error: Invalid JSON response from $endpoint: $response"
    exit 1
  fi
  local detail=$(echo "$response" | jq -r '.detail // ""')
  if [[ -n "$detail" && "$detail" != "Logged out successfully" && "$detail" != "Public room deleted successfully" && "$detail" != "Private room deleted successfully" ]]; then
    echo "Error: $endpoint failed: $response"
    exit 1
  fi
}

# 1. Create a user
echo "Creating user $USERNAME..."
CREATE_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"Test123!\"}")
echo "Response: $CREATE_USER_RESPONSE"
check_status "$CREATE_USER_RESPONSE" "POST /api/users/"
USER_ID=$(echo "$CREATE_USER_RESPONSE" | jq -r '.id')
if [[ -z "$USER_ID" || "$USER_ID" == "null" ]]; then
  echo "Error: User ID missing: $CREATE_USER_RESPONSE"
  exit 1
fi
echo "User created: ID=$USER_ID"

# 2. Log in to get tokens
echo "Logging in as $USERNAME..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"Test123!\"}")
echo "Response: $LOGIN_RESPONSE"
check_status "$LOGIN_RESPONSE" "POST /api/users/login"
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refresh_token')
if [[ -z "$ACCESS_TOKEN" || -z "$REFRESH_TOKEN" ]]; then
  echo "Error: Tokens missing in login response: $LOGIN_RESPONSE"
  exit 1
fi
echo "Logged in: Access Token=$ACCESS_TOKEN"

# 3. Create a public room
echo "Creating public room '$PUBLIC_ROOM_NAME'..."
PUBLIC_ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/public" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"name\":\"$PUBLIC_ROOM_NAME\"}")
echo "Response: $PUBLIC_ROOM_RESPONSE"
check_status "$PUBLIC_ROOM_RESPONSE" "POST /api/rooms/public"
PUBLIC_ROOM_ID=$(echo "$PUBLIC_ROOM_RESPONSE" | jq -r '.id')
if [[ -z "$PUBLIC_ROOM_ID" || "$PUBLIC_ROOM_ID" == "null" ]]; then
  echo "Error: Public room ID missing: $PUBLIC_ROOM_RESPONSE"
  exit 1
fi
echo "Public room created: ID=$PUBLIC_ROOM_ID"

# 4. Create a private room
echo "Creating private room '$PRIVATE_ROOM_NAME'..."
PRIVATE_ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/private" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"name\":\"$PRIVATE_ROOM_NAME\"}")
echo "Response: $PRIVATE_ROOM_RESPONSE"
check_status "$PRIVATE_ROOM_RESPONSE" "POST /api/rooms/private"
PRIVATE_ROOM_ID=$(echo "$PRIVATE_ROOM_RESPONSE" | jq -r '.id')
PRIVATE_ROOM_TOKEN=$(echo "$PRIVATE_ROOM_RESPONSE" | jq -r '.token')
if [[ -z "$PRIVATE_ROOM_ID" || -z "$PRIVATE_ROOM_TOKEN" ]]; then
  echo "Error: Private room ID or token missing: $PRIVATE_ROOM_RESPONSE"
  exit 1
fi
echo "Private room created: ID=$PRIVATE_ROOM_ID, Token=$PRIVATE_ROOM_TOKEN"

# 5. List public rooms
echo "Listing public rooms..."
PUBLIC_ROOMS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rooms/public" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$PUBLIC_ROOMS_RESPONSE" | jq
if ! echo "$PUBLIC_ROOMS_RESPONSE" | jq -e '.[] | select(.id == '"$PUBLIC_ROOM_ID"')' > /dev/null; then
  echo "Error: Public room ID=$PUBLIC_ROOM_ID not found in list"
  exit 1
fi

# 6. Join a public room
PUBLIC_ROOM_ID_TO_JOIN=${PUBLIC_ROOM_ID:-2}
echo "Joining public room ID=$PUBLIC_ROOM_ID_TO_JOIN..."
JOIN_PUBLIC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/public/join/$PUBLIC_ROOM_ID_TO_JOIN" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $JOIN_PUBLIC_RESPONSE"
check_status "$JOIN_PUBLIC_RESPONSE" "POST /api/rooms/public/join/$PUBLIC_ROOM_ID_TO_JOIN"
echo "$JOIN_PUBLIC_RESPONSE" | jq

# 7. Join the same public room again (should fail with 400)
echo "Attempting to join public room ID=$PUBLIC_ROOM_ID_TO_JOIN again..."
JOIN_PUBLIC_AGAIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/public/join/$PUBLIC_ROOM_ID_TO_JOIN" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$JOIN_PUBLIC_AGAIN_RESPONSE" | jq
if [[ $(echo "$JOIN_PUBLIC_AGAIN_RESPONSE" | jq -r '.detail') != "You are already a member of this room" ]]; then
  echo "Error: Expected 400 error for re-joining public room, got: $JOIN_PUBLIC_AGAIN_RESPONSE"
  exit 1
fi
echo "Successfully handled re-join attempt (expected 400 error)"

# 8. Join a private room
echo "Joining private room with token=$PRIVATE_ROOM_TOKEN..."
JOIN_PRIVATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/private/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"token\":\"$PRIVATE_ROOM_TOKEN\"}")
echo "Response: $JOIN_PRIVATE_RESPONSE"
check_status "$JOIN_PRIVATE_RESPONSE" "POST /api/rooms/private/join"
echo "$JOIN_PRIVATE_RESPONSE" | jq

# 9. List private rooms (created by user)
echo "Listing private rooms for user..."
PRIVATE_ROOMS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rooms/private" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$PRIVATE_ROOMS_RESPONSE" | jq
if ! echo "$PRIVATE_ROOMS_RESPONSE" | jq -e '.[] | select(.id == '"$PRIVATE_ROOM_ID"')' > /dev/null; then
  echo "Error: Private room ID=$PRIVATE_ROOM_ID not found in list"
  exit 1
fi

# 10. Search for a private room by token
echo "Searching for private room with token=$PRIVATE_ROOM_TOKEN..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rooms/search/$PRIVATE_ROOM_TOKEN" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $SEARCH_RESPONSE"
check_status "$SEARCH_RESPONSE" "GET /api/rooms/search/$PRIVATE_ROOM_TOKEN"
echo "$SEARCH_RESPONSE" | jq

# 11. Refresh tokens
echo "Refreshing tokens..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/refresh?refresh_token=$REFRESH_TOKEN" \
  -H "Content-Type: application/json")
echo "Response: $REFRESH_RESPONSE"
check_status "$REFRESH_RESPONSE" "POST /api/auth/refresh"
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.access_token')
NEW_REFRESH_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.refresh_token')
if [[ -z "$NEW_ACCESS_TOKEN" || -z "$NEW_REFRESH_TOKEN" ]]; then
  echo "Error: New tokens missing in refresh response: $REFRESH_RESPONSE"
  exit 1
fi
echo "Tokens refreshed: New Access Token=$NEW_ACCESS_TOKEN"
ACCESS_TOKEN=$NEW_ACCESS_TOKEN

# 12. Delete public room
echo "Deleting public room ID=$PUBLIC_ROOM_ID..."
DELETE_PUBLIC_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/rooms/public/$PUBLIC_ROOM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $DELETE_PUBLIC_RESPONSE"
check_status "$DELETE_PUBLIC_RESPONSE" "DELETE /api/rooms/public/$PUBLIC_ROOM_ID"
echo "$DELETE_PUBLIC_RESPONSE" | jq

# 13. Delete private room
echo "Deleting private room with token=$PRIVATE_ROOM_TOKEN..."
DELETE_PRIVATE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/rooms/private/$PRIVATE_ROOM_TOKEN" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $DELETE_PRIVATE_RESPONSE"
check_status "$DELETE_PRIVATE_RESPONSE" "DELETE /api/rooms/private/$PRIVATE_ROOM_TOKEN"
echo "$DELETE_PRIVATE_RESPONSE" | jq

# 14. Logout
echo "Logging out..."
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $LOGOUT_RESPONSE"
check_status "$LOGOUT_RESPONSE" "POST /api/users/logout"
echo "$LOGOUT_RESPONSE" | jq

# 15. Test invalid token (should fail)
echo "Testing with invalid token..."
INVALID_TOKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rooms/public" \
  -H "Authorization: Bearer invalid_token")
echo "$INVALID_TOKEN_RESPONSE" | jq
if [[ $(echo "$INVALID_TOKEN_RESPONSE" | jq -r '.detail') != "Invalid token" ]]; then
  echo "Error: Expected 'Invalid token' error, got: $INVALID_TOKEN_RESPONSE"
  exit 1
fi
echo "Successfully handled invalid token test (expected 401 error)"

# 11.5 Send a message to the public room
echo "Sending message to public room ID=$PUBLIC_ROOM_ID..."
SEND_MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/messages/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"room_id\":$PUBLIC_ROOM_ID,\"content\":\"Hello, room!\"}")
echo "Response: $SEND_MESSAGE_RESPONSE"
check_status "$SEND_MESSAGE_RESPONSE" "POST /api/messages/"
MESSAGE_ID=$(echo "$SEND_MESSAGE_RESPONSE" | jq -r '.id')
if [[ -z "$MESSAGE_ID" || "$MESSAGE_ID" == "null" ]]; then
  echo "Error: Message ID missing: $SEND_MESSAGE_RESPONSE"
  exit 1
fi
echo "Message sent: ID=$MESSAGE_ID"

# 11.6 Get messages from the public room
echo "Fetching messages from public room ID=$PUBLIC_ROOM_ID..."
GET_MESSAGES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/messages/room/$PUBLIC_ROOM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $GET_MESSAGES_RESPONSE"
check_status "$GET_MESSAGES_RESPONSE" "GET /api/messages/room/$PUBLIC_ROOM_ID"
if ! echo "$GET_MESSAGES_RESPONSE" | jq -e '.[] | select(.id == '"$MESSAGE_ID"')' > /dev/null; then
  echo "Error: Message ID=$MESSAGE_ID not found in room messages"
  exit 1
fi
echo "Messages fetched successfully"