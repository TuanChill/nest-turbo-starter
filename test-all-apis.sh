#!/usr/bin/env bash
set -e

BASE_URL="http://localhost:3304/circle/api"
PASSED=0
FAILED=0

test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"

  echo -n "Testing [$method] $endpoint - $name... "
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo "✅ PASS ($http_code)"
    PASSED=$((PASSED + 1))
  else
    echo "❌ FAIL ($http_code)"
    echo "  Body: $body"
    FAILED=$((FAILED + 1))
  fi
}

echo "=========================================="
echo " Starting Full Circle API Verification"
echo "=========================================="

# 1. Members
RAND_SUFFIX=$(date +%s)
test_endpoint "List Members" "GET" "/members" "" 200
test_endpoint "Get Member by ID" "GET" "/members/ln" "" 200
test_endpoint "Create Member" "POST" "/members" "{\"id\":\"curl-$RAND_SUFFIX\",\"name\":\"Curl Tester\",\"email\":\"curl-$RAND_SUFFIX@test.com\",\"role\":\"Member\",\"status\":\"online\"}" 201
test_endpoint "Update Member" "PATCH" "/members/curl-$RAND_SUFFIX" '{"status":"away"}' 200
test_endpoint "Get Member Teams" "GET" "/members/ln/teams" "" 200

# 2. Teams
test_endpoint "List Teams" "GET" "/teams" "" 200
test_endpoint "Get Team by ID" "GET" "/teams/CORE" "" 200
test_endpoint "Get Team Members" "GET" "/teams/CORE/members" "" 200
test_endpoint "Create Team" "POST" "/teams" '{"id":"QA","name":"Quality Assurance","key":"QA","icon":"Bug"}' 201

# 3. Labels
test_endpoint "List Labels" "GET" "/labels" "" 200
test_endpoint "Create Label" "POST" "/labels" '{"id":"test-label","name":"Test Label","color":"#ff0055"}' 201
test_endpoint "Update Label" "PATCH" "/labels/test-label" '{"name":"Updated Label"}' 200
test_endpoint "Delete Label" "DELETE" "/labels/test-label" "" 200

# 4. Projects
test_endpoint "List Projects" "GET" "/projects" "" 200
test_endpoint "Get Project by ID" "GET" "/projects/1" "" 200
test_endpoint "Create Project" "POST" "/projects" '{"name":"API Test Project","teamId":"CORE","leadId":"ln","priorityId":"high"}' 201
test_endpoint "Update Project" "PATCH" "/projects/1" '{"percentComplete":45}' 200

# 5. Cycles
test_endpoint "List Cycles" "GET" "/cycles" "" 200
test_endpoint "Get Cycle by ID" "GET" "/cycles/21" "" 200
test_endpoint "Create Cycle" "POST" "/cycles" '{"name":"Cycle 22","number":22,"teamId":"CORE","startDate":"2026-09-01","endDate":"2026-09-14","status":"upcoming"}' 201

# 6. Issues
test_endpoint "List Issues" "GET" "/issues" "" 200
test_endpoint "Get Issue by Identifier" "GET" "/issues/LNUI-701" "" 200
test_endpoint "Get Issue Detail" "GET" "/issues/LNUI-701/detail" "" 200
test_endpoint "Create Issue" "POST" "/issues" '{"title":"API Tested Issue","description":"Automated issue description","teamId":"CORE","statusId":"to-do","priorityId":"urgent","assigneeId":"ln"}' 201
test_endpoint "Update Issue" "PATCH" "/issues/LNUI-701" '{"priorityId":"urgent"}' 200
test_endpoint "Add Issue Comment" "POST" "/issues/LNUI-701/comments" '{"actorId":"ln","textContent":"This is an automated test comment."}' 201
ACT_ID=$(curl -s "$BASE_URL/issues/LNUI-701/detail" | node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf-8')); console.log(d.activities?.[0]?.id || '')")
if [ -n "$ACT_ID" ]; then
  test_endpoint "Add Issue Reaction" "POST" "/issues/activities/$ACT_ID/reactions" '{"emoji":"🔥","userId":"ln"}' 200
fi

# 7. Initiatives
test_endpoint "List Initiatives" "GET" "/initiatives" "" 200
test_endpoint "Get Initiative by ID" "GET" "/initiatives/component-platform" "" 200
test_endpoint "Create Initiative" "POST" "/initiatives" '{"name":"Test Initiative 2026","status":"planned","color":"#3b82f6","leadId":"ln"}' 201

# 8. Documents
test_endpoint "List Document Folders" "GET" "/documents/folders" "" 200
test_endpoint "Get Document by ID" "GET" "/documents/doc-1" "" 200
test_endpoint "Create Document" "POST" "/documents" '{"folderId":"team-documents","name":"Architecture Notes","icon":"📝","creatorId":"ln"}' 201

# 9. Inbox
test_endpoint "List Inbox Notifications" "GET" "/inbox?userId=ln" "" 200
test_endpoint "Mark Notification Read" "PATCH" "/inbox/notification-1/read" '{"read":true}' 200
test_endpoint "Mark All Notifications Read" "POST" "/inbox/read-all" '{"userId":"ln"}' 200

# 10. Views
test_endpoint "List Saved Views" "GET" "/views" "" 200
test_endpoint "Get View by ID" "GET" "/views/blocked-3-days" "" 200
test_endpoint "Create Saved View" "POST" "/views" '{"name":"Critical Bugs","description":"High & urgent issues","icon":"🚨","type":"issue","ownerId":"ln"}' 201

# 11. Reviews
test_endpoint "List PR Reviews" "GET" "/reviews" "" 200
test_endpoint "Get Review by ID" "GET" "/reviews/rev-101" "" 200
test_endpoint "Create PR Review" "POST" "/reviews" '{"title":"feat: Automated test PR review","authorId":"ln","status":"open","resolves":"LNUI-701"}' 201

# 12. Agent & AI
test_endpoint "Get Agent Examples" "GET" "/agent/examples" "" 200
test_endpoint "Chat with AI Agent" "POST" "/agent/chat" '{"message":"Summarize the active sprint issues"}' 200

echo "=========================================="
echo " Results: $PASSED Passed, $FAILED Failed"
echo "=========================================="

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
