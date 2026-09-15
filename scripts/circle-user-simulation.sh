#!/usr/bin/env bash
set -euo pipefail

# Authenticated, non-fallback Circle user simulation.
#
# Required:
#   CIRCLE_ACCESS_TOKEN   Bearer token for the member running the simulation
#   CIRCLE_WORKSPACE_ID   Existing workspace ID/slug, unless CREATE_WORKSPACE=1
#   CIRCLE_TEAM_ID        Existing team ID, unless CREATE_WORKSPACE=1
#
# Optional:
#   CIRCLE_API_URL        Defaults to the production API; set to local for CI
#   CREATE_WORKSPACE=1    Creates a throwaway workspace and team first. The API
#                         has no workspace-delete operation, so clean it up
#                         manually after the run.

: "${CIRCLE_ACCESS_TOKEN:?Set CIRCLE_ACCESS_TOKEN to an authenticated bearer token}"
CIRCLE_API_URL="${CIRCLE_API_URL:-https://pm-api.capylabs.io/circle/api}"
CREATE_WORKSPACE="${CREATE_WORKSPACE:-0}"
RUN_ID="$(date +%s)-$$"

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [[ -n "$body" ]]; then
    curl --fail-with-body -fsS -X "$method" "$CIRCLE_API_URL$path" \
      -H "Authorization: Bearer $CIRCLE_ACCESS_TOKEN" \
      -H 'Content-Type: application/json' \
      --data "$body"
  else
    curl --fail-with-body -fsS -X "$method" "$CIRCLE_API_URL$path" \
      -H "Authorization: Bearer $CIRCLE_ACCESS_TOKEN"
  fi
}

assert_json() {
  local label="$1"
  local json="$2"
  shift 2
  if ! jq -e "$@" >/dev/null <<<"$json"; then
    echo "Simulation assertion failed: $label" >&2
    echo "$json" >&2
    exit 1
  fi
  echo "PASS $label"
}

echo "Running authenticated Circle simulation against $CIRCLE_API_URL"
health="$(api GET /health)"
assert_json 'API health' "$health" '.status == "ok"'

if [[ "$CREATE_WORKSPACE" == "1" ]]; then
  workspace_slug="circle-sim-$RUN_ID"
  workspace="$(api POST /workspaces "$(jq -nc --arg name "Circle Simulation $RUN_ID" --arg slug "$workspace_slug" '{name:$name,slug:$slug}')")"
  WORKSPACE_ID="$(jq -er '.id // .workspace.id' <<<"$workspace")"
  team_id="SIM${RUN_ID//[^[:alnum:]]/}"
  team="$(api POST /teams "$(jq -nc --arg id "$team_id" --arg workspaceId "$WORKSPACE_ID" '{id:$id,name:"Circle Simulation Team",workspaceId:$workspaceId,joined:true}')")"
  TEAM_ID="$(jq -er '.id // .team.id' <<<"$team")"
else
  : "${CIRCLE_WORKSPACE_ID:?Set CIRCLE_WORKSPACE_ID or use CREATE_WORKSPACE=1}"
  : "${CIRCLE_TEAM_ID:?Set CIRCLE_TEAM_ID or use CREATE_WORKSPACE=1}"
  WORKSPACE_ID="$CIRCLE_WORKSPACE_ID"
  TEAM_ID="$CIRCLE_TEAM_ID"
  workspace="$(api GET "/workspaces/$WORKSPACE_ID")"
  team="$(api GET "/teams/$TEAM_ID")"
  assert_json 'workspace is readable' "$workspace" '.id != null'
  assert_json 'team is readable' "$team" '.id != null'
fi

team_members="$(api GET "/teams/$TEAM_ID/members")"
assignee_id="$(jq -er '.[0].id' <<<"$team_members")"

group="$(api POST /labels/groups "$(jq -nc --arg workspaceId "$WORKSPACE_ID" '{workspaceId:$workspaceId,name:"Simulation exclusive group",scope:"both",mutuallyExclusive:true}')")"
group_id="$(jq -er '.id' <<<"$group")"
label="$(api POST /labels "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg id "sim-label-$RUN_ID" --arg groupId "$group_id" '{workspaceId:$workspaceId,id:$id,name:"Simulation label",color:"#5e6ad2",scope:"both",groupId:$groupId}')")"
label_id="$(jq -er '.id' <<<"$label")"

project="$(api POST /projects "$(jq -nc --arg teamId "$TEAM_ID" --arg labelId "$label_id" '{name:"Circle simulation project",teamId:$teamId,priorityId:"high",healthId:"on-track",labelIds:[$labelId]}')")"
project_id="$(jq -er '.id' <<<"$project")"

project_template="$(api POST /project-templates "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg teamId "$TEAM_ID" --arg labelId "$label_id" '{name:"Circle simulation project template",scope:"team",workspaceId:$workspaceId,teamId:$teamId,config:{project:{priorityId:"medium",healthId:"on-track",labelIds:[$labelId]},milestones:[{key:"milestone",name:"Simulation milestone"}],issues:[{key:"root",title:"Simulation root issue",labelIds:[$labelId]},{key:"child",title:"Simulation child issue",parentKey:"root",labelIds:[$labelId]}]}}')")"
project_template_id="$(jq -er '.id' <<<"$project_template")"

issue_template="$(api POST /issue-templates "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg teamId "$TEAM_ID" --arg labelId "$label_id" '{name:"Circle simulation issue template",scope:"team",workspaceId:$workspaceId,teamId:$teamId,config:{title:"Simulation issue",description:"Created by the authenticated user simulation",statusId:"to-do",priorityId:"medium",labelIds:[$labelId]}}')")"
issue_template_id="$(jq -er '.id' <<<"$issue_template")"

initiative="$(api POST /initiatives "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg projectId "$project_id" --arg labelId "$label_id" '{name:"Circle simulation initiative",workspaceId:$workspaceId,status:"planned",projectIds:[$projectId],labelIds:[$labelId]}')")"
initiative_id="$(jq -er '.id' <<<"$initiative")"

cycle="$(api POST /cycles "$(jq -nc --arg teamId "$TEAM_ID" --argjson number "$((10000 + RANDOM))" '{name:"Circle simulation cycle",teamId:$teamId,number:$number,status:"planned",startDate:"2099-01-01",endDate:"2099-01-14",capacity:20}')")"
cycle_id="$(jq -er '.id' <<<"$cycle")"

root="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" --arg projectId "$project_id" --arg cycleId "$cycle_id" --arg assigneeId "$assignee_id" --arg labelId "$label_id" '{title:"Circle simulation root issue",description:"Authenticated simulation",teamId:$teamId,projectId:$projectId,cycleId:$cycleId,assigneeId:$assigneeId,statusId:"to-do",priorityId:"urgent",labelIds:[$labelId]}')")"
root_identifier="$(jq -er '.identifier' <<<"$root")"
root_id="$(jq -er '.id' <<<"$root")"
child="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" --arg parentIssueId "$root_id" --arg projectId "$project_id" '{title:"Circle simulation child issue",teamId:$teamId,parentIssueId:$parentIssueId,projectId:$projectId,statusId:"to-do",priorityId:"medium"}')")"
child_identifier="$(jq -er '.identifier' <<<"$child")"
related="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" '{title:"Circle simulation related issue",teamId:$teamId,statusId:"to-do",priorityId:"low"}')")"
related_identifier="$(jq -er '.identifier' <<<"$related")"

api POST "/issues/$root_identifier/relations" "$(jq -nc --arg targetIdentifier "$related_identifier" '{targetIdentifier:$targetIdentifier,relationType:"relates_to"}')" >/dev/null
api POST "/issues/$root_identifier/comments" "$(jq -nc '{textContent:"Simulation comment with persisted activity"}')" >/dev/null
detail="$(api GET "/issues/$root_identifier/detail")"
activity_id="$(jq -er '.activity[0].id' <<<"$detail")"
api POST "/issues/activities/$activity_id/reactions" '{emoji:"✅"}' >/dev/null
api PATCH "/issues/$root_identifier" "$(jq -nc --arg assigneeId "$assignee_id" '{statusId:"in-progress",priorityId:"high",assigneeId:$assigneeId}')" >/dev/null

subscription="$(api GET "/issues/$root_identifier/subscription")"
assert_json 'issue creator is subscribed' "$subscription" '.subscribed == true'
unsubscribed="$(api DELETE "/issues/$root_identifier/subscription")"
assert_json 'issue unsubscribe persisted' "$unsubscribed" '.subscribed == false'
resubscribed="$(api POST "/issues/$root_identifier/subscription")"
assert_json 'issue resubscribe persisted' "$resubscribed" '.subscribed == true'

cloned_project="$(api POST "/projects/from-template/$project_template_id" "$(jq -nc --arg teamId "$TEAM_ID" '{name:"Circle simulation cloned project",teamId:$teamId}')")"
cloned_project_id="$(jq -er '.id // .projectId' <<<"$cloned_project")"

project_check="$(api GET "/projects/$project_id")"
assert_json 'project persisted with live label' "$project_check" '.labels | length > 0'
assert_json 'parent issue and activity persisted' "$detail" --arg child_identifier "$child_identifier" '.subIssueIds | any(.[]; . == $child_identifier) and (.activity | length) > 0'
assert_json 'relation persisted' "$detail" --arg related_identifier "$related_identifier" '.relations | any(.[]; .identifier == $related_identifier)'
clone_check="$(api GET "/projects/$cloned_project_id")"
assert_json 'project template clone persisted' "$clone_check" '.id != null and .id != ""'

echo "PASS authenticated user simulation"
echo "workspace=$WORKSPACE_ID team=$TEAM_ID project=$project_id clonedProject=$cloned_project_id rootIssue=$root_identifier childIssue=$child_identifier initiative=$initiative_id cycle=$cycle_id issueTemplate=$issue_template_id"
