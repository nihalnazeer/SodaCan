#!/bin/bash

# Base URL
BASE_URL="http://localhost:8000"

# Unique username/email to avoid duplicates
TIMESTAMP=$(date +%s)
USERNAME="testuser_$TIMESTAMP"
EMAIL="test_$TIMESTAMP@example.com"

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
echo "Creating public room 'Maqsad'..."
PUBLIC_ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/public" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name":"Maqsad"}')
echo "Response: $PUBLIC_ROOM_RESPONSE"
check_status "$PUBLIC_ROOM_RESPONSE" "POST /api/rooms/public"
PUBLIC_ROOM_ID=$(echo "$PUBLIC_ROOM_RESPONSE" | jq -r '.id')
echo "Public room created: ID=$PUBLIC_ROOM_ID"

# 4. Create a private room
echo "Creating private room 'SecretClub'..."
PRIVATE_ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/private" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name":"SecretClub"}')
echo "Response: $PRIVATE_ROOM_RESPONSE"
check_status "$PRIVATE_ROOM_RESPONSE" "POST /api/rooms/private"
PRIVATE_ROOM_ID=$(echo "$PRIVATE_ROOM_RESPONSE" | jq -r '.id')
PRIVATE_ROOM_TOKEN=$(echo "$PRIVATE_ROOM_RESPONSE" | jq -r '.token')
echo "Private room created: ID=$PRIVATE_ROOM_ID, Token=$PRIVATE_ROOM_TOKEN"

# 5. List public rooms
echo "Listing public rooms..."
curl -s -X GET "$BASE_URL/api/rooms/public" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 6. Join a public room (use created room or fallback to 2)
PUBLIC_ROOM_ID_TO_JOIN=${PUBLIC_ROOM_ID:-2}
echo "Joining public room ID=$PUBLIC_ROOM_ID_TO_JOIN..."
JOIN_PUBLIC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rooms/public/join/$PUBLIC_ROOM_ID_TO_JOIN" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $JOIN_PUBLIC_RESPONSE"
check_status "$JOIN_PUBLIC_RESPONSE" "POST /api/rooms/public/join/$PUBLIC_ROOM_ID_TO_JOIN"
echo "$JOIN_PUBLIC_RESPONSE" | jq

# 7. Join the same public room again (should fail)
echo "Attempting to join public room ID=$PUBLIC_ROOM_ID_TO_JOIN again..."
curl -s -X POST "$BASE_URL/api/rooms/public/join/$PUBLIC_ROOM_ID_TO_JOIN" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

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
curl -s -X GET "$BASE_URL/api/rooms/private" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 10. Search for a private room by token
echo "Searching for private room with token=$PRIVATE_ROOM_TOKEN..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rooms/search/$PRIVATE_ROOM_TOKEN" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $SEARCH_RESPONSE"
check_status "$SEARCH_RESPONSE" "GET /api/rooms/search/$PRIVATE_ROOM_TOKEN"
echo "$SEARCH_RESPONSE" | jq

# 11. Refresh tokens
echo "Refreshing tokens..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
echo "Response: $REFRESH_RESPONSE"
check_status "$REFRESH_RESPONSE" "POST /api/auth/refresh"
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.access_token')
NEW_REFRESH_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.refresh_token')
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
curl -s -X GET "$BASE_URL/api/rooms/public" \
  -H "Authorization: Bearer invalid_token" | jq