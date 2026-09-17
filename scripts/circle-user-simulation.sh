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
#   CIRCLE_API_URL        Defaults to the local project service
#   CREATE_WORKSPACE=1    Creates a throwaway workspace and team first. The API
#                         has no workspace-delete operation, so clean it up
#                         manually after the run.

: "${CIRCLE_ACCESS_TOKEN:?Set CIRCLE_ACCESS_TOKEN to an authenticated bearer token}"
CIRCLE_API_URL="${CIRCLE_API_URL:-http://localhost:3304/circle/api}"
CREATE_WORKSPACE="${CREATE_WORKSPACE:-0}"
RUN_ID="$(date +%s)-$$"

case "$CIRCLE_API_URL" in
  http://localhost:*|http://127.0.0.1:*|http://[::1]:*|http://localhost/*|http://127.0.0.1/*|http://[::1]/*)
    ;;
  *)
    echo "Refusing non-local smoke target: $CIRCLE_API_URL" >&2
    echo "Set CIRCLE_API_URL to a localhost URL to run the simulation." >&2
    exit 2
    ;;
esac

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local response_file
  response_file="$(mktemp)"
  if [[ -n "$body" ]]; then
    if ! curl --fail-with-body -sS -X "$method" "$CIRCLE_API_URL$path" \
      -H "Authorization: Bearer $CIRCLE_ACCESS_TOKEN" \
      -H 'Content-Type: application/json' \
      --data "$body" >"$response_file"; then
      echo "Simulation API request failed: $method $path" >&2
      cat "$response_file" >&2
      rm -f "$response_file"
      return 1
    fi
  else
    if ! curl --fail-with-body -sS -X "$method" "$CIRCLE_API_URL$path" \
      -H "Authorization: Bearer $CIRCLE_ACCESS_TOKEN" >"$response_file"; then
      echo "Simulation API request failed: $method $path" >&2
      cat "$response_file" >&2
      rm -f "$response_file"
      return 1
    fi
  fi
  cat "$response_file"
  rm -f "$response_file"
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

expect_api_failure() {
  local label="$1"
  local method="$2"
  local path="$3"
  local body="${4:-}"
  local response
  if response="$(api "$method" "$path" "$body" 2>/dev/null)"; then
    echo "Simulation assertion failed: $label" >&2
    echo "$response" >&2
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
  # Team IDs are capped at ten characters by the API. Hash the per-run value
  # before truncating so repeated local runs in the same second remain unique.
  team_id="SIM$(printf '%s' "$RUN_ID" | shasum -a 256 | cut -c1-7 | tr '[:lower:]' '[:upper:]')"
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

# Team labels must be visible to their owning team and hidden from another
# team in the same workspace. Keep the second team throwaway and only create it
# in the self-provisioning simulation path.
team_label_id=''
if [[ "$CREATE_WORKSPACE" == "1" ]]; then
  secondary_team_id="ALT$(printf '%s-secondary' "$RUN_ID" | shasum -a 256 | cut -c1-7 | tr '[:lower:]' '[:upper:]')"
  secondary_team="$(api POST /teams "$(jq -nc --arg id "$secondary_team_id" --arg workspaceId "$WORKSPACE_ID" '{id:$id,name:"Circle Simulation Secondary Team",workspaceId:$workspaceId,joined:true}')")"
  SECONDARY_TEAM_ID="$(jq -er '.id // .team.id' <<<"$secondary_team")"
fi

if api POST /workspaces/join "$(jq -nc --arg slug "$WORKSPACE_ID" '{slug:$slug}')" >/dev/null 2>&1; then
  echo 'Workspace slug join was not rejected' >&2
  exit 1
else
  echo 'PASS workspace slug cannot grant membership without an invite'
fi

team_members="$(api GET "/teams/$TEAM_ID/members")"
assignee_id="$(jq -er '.[0].id' <<<"$team_members")"

group="$(api POST /labels/groups "$(jq -nc --arg workspaceId "$WORKSPACE_ID" '{workspaceId:$workspaceId,name:"Simulation exclusive group",scope:"both",mutuallyExclusive:true}')")"
group_id="$(jq -er '.id' <<<"$group")"
label="$(api POST /labels "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg id "sim-label-$RUN_ID" --arg groupId "$group_id" '{workspaceId:$workspaceId,id:$id,name:"Simulation label",color:"#5e6ad2",scope:"both",groupId:$groupId}')")"
label_id="$(jq -er '.id' <<<"$label")"
second_label="$(api POST /labels "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg id "sim-label-secondary-$RUN_ID" --arg groupId "$group_id" '{workspaceId:$workspaceId,id:$id,name:"Simulation secondary label",color:"#f2c94c",scope:"both",groupId:$groupId}')")"
second_label_id="$(jq -er '.id' <<<"$second_label")"

if [[ "$CREATE_WORKSPACE" == "1" ]]; then
  team_label="$(api POST /labels "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg teamId "$TEAM_ID" --arg id "sim-team-label-$RUN_ID" '{workspaceId:$workspaceId,teamId:$teamId,id:$id,name:"Simulation team label",color:"#26b5ce",scope:"both"}')")"
  team_label_id="$(jq -er '.id' <<<"$team_label")"
  team_labels="$(api GET "/labels?teamId=$TEAM_ID")"
  assert_json 'team label visible to its owning team' "$team_labels" \
    --arg label_id "$team_label_id" 'any(.[]; .id == $label_id and .teamId != null)'
  secondary_team_labels="$(api GET "/labels?teamId=$SECONDARY_TEAM_ID")"
  assert_json 'team label hidden from another team' "$secondary_team_labels" \
    --arg label_id "$team_label_id" 'all(.[]; .id != $label_id)'
fi

project_payload="$(jq -nc --arg teamId "$TEAM_ID" --arg labelId "$label_id" --arg secondaryTeamId "${SECONDARY_TEAM_ID:-}" '{name:"Circle simulation project",teamId:$teamId,priorityId:"high",healthId:"on-track",labelIds:[$labelId]} | if $secondaryTeamId == "" then . else .teamIds=[$secondaryTeamId] end')"
project="$(api POST /projects "$project_payload")"
project_id="$(jq -er '.id' <<<"$project")"
if [[ -n "${SECONDARY_TEAM_ID:-}" ]]; then
  assert_json 'project persists its multi-team membership' "$project" \
    --arg primary_team_id "$TEAM_ID" --arg secondary_team_id "$SECONDARY_TEAM_ID" \
    '(.teamIds | index($primary_team_id)) != null and (.teamIds | index($secondary_team_id)) != null'
fi

saved_view="$(api POST /views "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg teamId "$TEAM_ID" --arg projectId "$project_id" '{name:"Circle simulation project view",workspaceId:$workspaceId,type:"project",teamId:$teamId,projectId:$projectId,layout:"grid",filter:{statusCategories:["started"],priorityIds:["high"]}}')")"
saved_view_id="$(jq -er '.id' <<<"$saved_view")"
saved_view_check="$(api GET "/views/$saved_view_id")"
assert_json 'saved view persists scope, layout and filters' "$saved_view_check" \
  --arg team_id "$TEAM_ID" --arg project_id "$project_id" \
  '.teamId == $team_id and .projectId == $project_id and .layout == "grid" and (.filter.statusCategories | index("started")) != null'
team_views="$(api GET "/views?teamId=$TEAM_ID")"
assert_json 'saved view is listed for its owning team' "$team_views" \
  --arg view_id "$saved_view_id" 'any(.[]; .id == $view_id)'
if [[ -n "${SECONDARY_TEAM_ID:-}" ]]; then
  secondary_team_views="$(api GET "/views?teamId=$SECONDARY_TEAM_ID")"
  assert_json 'team-scoped saved view hidden from another team' "$secondary_team_views" \
    --arg view_id "$saved_view_id" 'all(.[]; .id != $view_id)'
fi

project_template="$(api POST /project-templates "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg teamId "$TEAM_ID" --arg labelId "$label_id" '{name:"Circle simulation project template",scope:"team",workspaceId:$workspaceId,teamId:$teamId,config:{project:{priorityId:"medium",healthId:"on-track",labelIds:[$labelId]},milestones:[{key:"milestone",name:"Simulation milestone"}],issues:[{key:"root",title:"Simulation root issue",labelIds:[$labelId]},{key:"child",title:"Simulation child issue",parentKey:"root",labelIds:[$labelId]}],relations:[{sourceKey:"root",targetKey:"child",relationType:"relates_to"}]}}')")"
project_template_id="$(jq -er '.id' <<<"$project_template")"

issue_template="$(api POST /issue-templates "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg teamId "$TEAM_ID" --arg labelId "$label_id" '{name:"Circle simulation issue template",scope:"team",workspaceId:$workspaceId,teamId:$teamId,config:{title:"Simulation issue",description:"Created by the authenticated user simulation",statusId:"to-do",priorityId:"medium",labelIds:[$labelId]}}')")"
issue_template_id="$(jq -er '.id' <<<"$issue_template")"
issue_template_check="$(api GET "/issue-templates/$issue_template_id")"
assert_json 'issue template persisted with real defaults' "$issue_template_check" \
  --arg label_id "$label_id" \
  '.config.title == "Simulation issue" and (.config.labelIds | index($label_id)) != null'

initiative="$(api POST /initiatives "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg projectId "$project_id" --arg labelId "$label_id" '{name:"Circle simulation initiative",workspaceId:$workspaceId,status:"planned",projectIds:[$projectId],labelIds:[$labelId]}')")"
initiative_id="$(jq -er '.id' <<<"$initiative")"

cycle="$(api POST /cycles "$(jq -nc --arg teamId "$TEAM_ID" --argjson number "$((10000 + RANDOM))" '{name:"Circle simulation cycle",teamId:$teamId,number:$number,status:"planned",startDate:"2099-01-01",endDate:"2099-01-14",capacity:20}')")"
cycle_id="$(jq -er '.id' <<<"$cycle")"

calendar_subscription="$(api POST "/cycles/calendar-subscription?teamId=$TEAM_ID")"
calendar_feed_path="$(jq -er '.feedPath' <<<"$calendar_subscription")"
assert_json 'cycle calendar subscription persisted' "$calendar_subscription" \
  --arg team_id "$TEAM_ID" '.teamId == $team_id and .subscribed == true and (.feedPath | endswith(".ics"))'
calendar_feed_url="${CIRCLE_API_URL%/circle/api}$calendar_feed_path"
calendar_feed="$(curl --fail-with-body -sS "$calendar_feed_url")"
if ! grep -q 'BEGIN:VCALENDAR' <<<"$calendar_feed" || ! grep -q 'Cycle' <<<"$calendar_feed"; then
  echo 'Simulation assertion failed: cycle calendar feed contains no calendar data' >&2
  exit 1
fi
echo 'PASS cycle calendar feed is accessible with its tokenized URL'
calendar_subscription="$(api GET "/cycles/calendar-subscription?teamId=$TEAM_ID")"
assert_json 'cycle calendar subscription is readable' "$calendar_subscription" '.subscribed == true'
revoked_calendar="$(api DELETE "/cycles/calendar-subscription?teamId=$TEAM_ID")"
assert_json 'cycle calendar subscription revokes' "$revoked_calendar" '.subscribed == false'
revoked_feed_status="$(curl -sS -o /dev/null -w '%{http_code}' "$calendar_feed_url")"
if [[ "$revoked_feed_status" == "200" ]]; then
  echo 'Simulation assertion failed: revoked cycle calendar feed remained accessible' >&2
  exit 1
fi
echo 'PASS revoked cycle calendar feed is inaccessible'

root="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" --arg projectId "$project_id" --arg cycleId "$cycle_id" --arg assigneeId "$assignee_id" --arg labelId "$label_id" '{title:"Circle simulation root issue",description:"Authenticated simulation",teamId:$teamId,projectId:$projectId,cycleId:$cycleId,assigneeId:$assigneeId,statusId:"to-do",priorityId:"urgent",labelIds:[$labelId]}')")"
root_identifier="$(jq -er '.identifier' <<<"$root")"
root_id="$(jq -er '.id' <<<"$root")"
mention_id="$(jq -er '.[1].id // .[0].id' <<<"$team_members")"
child="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" --arg parentIssueId "$root_id" --arg projectId "$project_id" --arg cycleId "$cycle_id" '{title:"Circle simulation child issue",teamId:$teamId,parentIssueId:$parentIssueId,projectId:$projectId,cycleId:$cycleId,statusId:"to-do",priorityId:"medium"}')")"
child_identifier="$(jq -er '.identifier' <<<"$child")"
related="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" '{title:"Circle simulation related issue",teamId:$teamId,statusId:"to-do",priorityId:"low"}')")"
related_identifier="$(jq -er '.identifier' <<<"$related")"

if [[ -n "${SECONDARY_TEAM_ID:-}" ]]; then
  secondary_cycle="$(api POST /cycles "$(jq -nc --arg teamId "$SECONDARY_TEAM_ID" --argjson number "$((20000 + RANDOM))" '{name:"Circle simulation secondary cycle",teamId:$teamId,number:$number,status:"planned",startDate:"2099-02-01",endDate:"2099-02-14",capacity:20}')")"
  secondary_cycle_id="$(jq -er '.id' <<<"$secondary_cycle")"
  secondary_issue="$(api POST /issues "$(jq -nc --arg teamId "$SECONDARY_TEAM_ID" '{title:"Circle simulation secondary issue",teamId:$teamId,statusId:"to-do",priorityId:"low"}')")"
  secondary_issue_id="$(jq -er '.id' <<<"$secondary_issue")"
  secondary_issue_identifier="$(jq -er '.identifier' <<<"$secondary_issue")"
  expect_api_failure 'cross-team label assignment rejected' PATCH "/issues/$secondary_issue_identifier" \
    "$(jq -nc --arg labelId "$team_label_id" '{labelIds:[$labelId]}')"
  expect_api_failure 'cross-team parent issue rejected' POST /issues \
    "$(jq -nc --arg teamId "$TEAM_ID" --arg parentIssueId "$secondary_issue_id" '{title:"Invalid cross-team child",teamId:$teamId,parentIssueId:$parentIssueId,statusId:"to-do",priorityId:"low"}')"
  expect_api_failure 'cross-team cycle assignment rejected' POST /issues \
    "$(jq -nc --arg teamId "$TEAM_ID" --arg cycleId "$secondary_cycle_id" '{title:"Invalid cross-team cycle issue",teamId:$teamId,cycleId:$cycleId,statusId:"to-do",priorityId:"low"}')"
fi

api POST "/issues/$root_identifier/relations" "$(jq -nc --arg targetIdentifier "$related_identifier" '{targetIdentifier:$targetIdentifier,relationType:"relates_to"}')" >/dev/null
api POST "/issues/$root_identifier/comments" "$(jq -nc --arg mentionId "$mention_id" '{textContent:("Simulation comment with persisted activity @" + $mentionId)}')" >/dev/null
detail="$(api GET "/issues/$root_identifier/detail")"
activity_id="$(jq -er '.activity[] | select(.kind == "comment") | .id' <<<"$detail")"
api POST "/issues/activities/$activity_id/reactions" '{"emoji":"✅"}' >/dev/null

if api PATCH "/issues/$root_identifier" "$(jq -nc --arg labelA "$label_id" --arg labelB "$second_label_id" '{labelIds:[$labelA,$labelB]}')" >/dev/null 2>&1; then
  echo 'Mutually exclusive label group was not enforced' >&2
  exit 1
else
  echo 'PASS mutually exclusive label group rejected conflicting update'
fi

api PATCH "/issues/$root_identifier" "$(jq -nc --arg assigneeId "$assignee_id" --arg labelId "$label_id" '{statusId:"in-progress",priorityId:"high",assigneeId:$assigneeId,labelIds:[$labelId]}')" >/dev/null

project_subscription="$(api GET "/projects/$project_id/subscription")"
assert_json 'project starts unsubscribed' "$project_subscription" '.subscribed == false'
project_subscription="$(api POST "/projects/$project_id/subscription")"
assert_json 'project subscription persisted' "$project_subscription" '.subscribed == true'

project_update="$(api POST "/projects/$project_id/updates" '{"health":"at-risk","blocks":[{"type":"paragraph","text":"Simulation project update"}]}')"
project_update_id="$(jq -er '.updates[0].id' <<<"$project_update")"
project_update="$(api PATCH "/projects/$project_id/updates/$project_update_id" '{"health":"on-track","blocks":[{"type":"paragraph","text":"Edited simulation project update"}]}')"
assert_json 'project update edit persisted' "$project_update" --arg update_id "$project_update_id" '.updates | any(.[]; .id == $update_id and .health == "on-track" and ((.blocks // []) | any(.[]; (.text // "") | contains("Edited simulation"))))'
second_project_update="$(api POST "/projects/$project_id/updates" '{"health":"off-track","blocks":[{"type":"paragraph","text":"Temporary simulation project update"}]}')"
second_project_update_id="$(jq -er '.updates[0].id' <<<"$second_project_update")"
project_after_delete_detail="$(api DELETE "/projects/$project_id/updates/$second_project_update_id")"
project_after_delete="$(api GET "/projects/$project_id")"
assert_json 'project update deletion removes the update' "$project_after_delete_detail" --arg update_id "$second_project_update_id" '.updates | all(.[]; .id != $update_id)'
assert_json 'project update deletion rolls health back' "$project_after_delete" '.health.id == "on-track"'
milestone="$(api POST "/projects/$project_id/milestones" '{"name":"Simulation milestone","targetDate":"2099-01-07"}')"
milestone_id="$(jq -er '.milestones | last | .id' <<<"$milestone")"
api PATCH "/projects/$project_id/milestones/$milestone_id/toggle" >/dev/null

initiative_update="$(api POST "/initiatives/$initiative_id/updates" '{"health":"at-risk","blocks":[{"type":"paragraph","text":"Simulation initiative update"}]}')"
initiative_update_id="$(jq -er '.updates[0].id' <<<"$initiative_update")"
initiative_update="$(api PATCH "/initiatives/$initiative_id/updates/$initiative_update_id" '{"health":"on-track","blocks":[{"type":"paragraph","text":"Edited simulation initiative update"}]}')"
assert_json 'initiative update edit persisted' "$initiative_update" --arg update_id "$initiative_update_id" '.updates | any(.[]; .id == $update_id and .health == "on-track" and ((.blocks // []) | any(.[]; (.text // "") | contains("Edited simulation"))))'
initiative_update="$(api POST "/initiatives/$initiative_id/updates/$initiative_update_id/reactions" '{"emoji":"🚀"}')"
assert_json 'initiative update reaction persisted' "$initiative_update" \
  --arg update_id "$initiative_update_id" \
  '.updates | any(.[]; .id == $update_id and ((.reactions // []) | any(.emoji == "🚀" and .count == 1)))'
initiative_update="$(api POST "/initiatives/$initiative_id/updates/$initiative_update_id/reactions" '{"emoji":"🚀"}')"
assert_json 'initiative update reaction is idempotent' "$initiative_update" \
  --arg update_id "$initiative_update_id" \
  '.updates | any(.[]; .id == $update_id and ((.reactions // []) | any(.emoji == "🚀" and .count == 1)))'
initiative_update="$(api DELETE "/initiatives/$initiative_id/updates/$initiative_update_id/reactions/%F0%9F%9A%80")"
assert_json 'initiative update reaction removal persisted' "$initiative_update" \
  --arg update_id "$initiative_update_id" \
  '.updates | any(.[]; .id == $update_id and ((.reactions // []) | all(.emoji != "🚀")))'
second_initiative_update="$(api POST "/initiatives/$initiative_id/updates" '{"health":"off-track","blocks":[{"type":"paragraph","text":"Temporary simulation initiative update"}]}')"
second_initiative_update_id="$(jq -er '.updates[0].id' <<<"$second_initiative_update")"
initiative_after_delete="$(api DELETE "/initiatives/$initiative_id/updates/$second_initiative_update_id")"
assert_json 'initiative update deletion rolls health back' "$initiative_after_delete" --arg update_id "$second_initiative_update_id" '.health.id == "on-track" and (.updates | all(.[]; .id != $update_id))'

cycle_check="$(api GET "/cycles/$cycle_id")"
assert_json 'cycle progress is derived from issues' "$cycle_check" '.scope >= 2 and .started >= 1'
cycle_history="$(api GET "/cycles/$cycle_id/history")"
assert_json 'cycle history is persisted' "$cycle_history" 'length >= 1'

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
detail="$(api GET "/issues/$root_identifier/detail")"
assert_json 'parent issue and activity persisted' "$detail" --arg child_identifier "$child_identifier" '((.subIssueIds // []) | any(.[]; . == $child_identifier)) and ((.activity // []) | length > 0)'
assert_json 'relation persisted' "$detail" --arg related_identifier "$related_identifier" '.relations | any(.[]; .identifier == $related_identifier)'
assert_json 'comment mention and reaction persisted' "$detail" 'any(.activity[]; any((.body // [])[]; ((.text // "") | contains("Simulation comment")))) and any(.activity[]; ((.reactions // []) | length > 0))'
project_detail="$(api GET "/projects/$project_id/detail")"
assert_json 'project update and milestone activity persisted' "$project_detail" '((.updates // []) | length >= 1) and ((.milestones // []) | length >= 1) and ((.activity // []) | length >= 2)'
notification="$(api POST /inbox "$(jq -nc --arg issueIdentifier "$root_identifier" --arg memberId "$assignee_id" '{issueIdentifier:$issueIdentifier,userId:$memberId,actorId:$memberId,type:"mention",content:"Simulation snooze notification"}')")"
notification_id="$(jq -er '.id' <<<"$notification")"
inbox="$(api GET /inbox)"
assert_json 'inbox returns a persisted collection' "$inbox" 'type == "array"'
assert_json 'inbox notification persisted' "$inbox" --arg notification_id "$notification_id" 'any(.[]; .id == $notification_id)'
future_snooze="$(node -e 'process.stdout.write(new Date(Date.now() + 3600000).toISOString())')"
snoozed_notification="$(api PATCH "/inbox/$notification_id/snooze" "$(jq -nc --arg until "$future_snooze" '{until:$until}')")"
assert_json 'inbox notification snooze persisted' "$snoozed_notification" \
  --arg notification_id "$notification_id" --arg until "$future_snooze" \
  '.id == $notification_id and .snoozedUntil == $until'
hidden_snoozed="$(api GET /inbox)"
assert_json 'snoozed notification is hidden by default' "$hidden_snoozed" \
  --arg notification_id "$notification_id" 'all(.[]; .id != $notification_id)'
visible_snoozed="$(api GET '/inbox?includeSnoozed=true')"
assert_json 'snoozed notification is visible when requested' "$visible_snoozed" \
  --arg notification_id "$notification_id" --arg until "$future_snooze" \
  'any(.[]; .id == $notification_id and .snoozedUntil == $until)'
unsnoozed_notification="$(api PATCH "/inbox/$notification_id/snooze" '{"until":null}')"
assert_json 'inbox notification unsnooze persisted' "$unsnoozed_notification" \
  --arg notification_id "$notification_id" '.id == $notification_id and .snoozedUntil == null'
clone_check="$(api GET "/projects/$cloned_project_id")"
assert_json 'project template clone persisted' "$clone_check" '.id != null and .id != ""'
cloned_issues="$(api GET "/issues?teamId=$TEAM_ID&projectId=$cloned_project_id")"
cloned_root_identifier="$(jq -er '.[] | select(.title == "Simulation root issue") | .identifier' <<<"$cloned_issues")"
cloned_child_identifier="$(jq -er '.[] | select(.title == "Simulation child issue") | .identifier' <<<"$cloned_issues")"
cloned_detail="$(api GET "/issues/$cloned_root_identifier/detail")"
assert_json 'template clone remaps issue relation' "$cloned_detail" --arg cloned_child_identifier "$cloned_child_identifier" '.relations | any(.[]; .identifier == $cloned_child_identifier)'

template_config="$(jq -c '.config' <<<"$issue_template_check")"
templated_issue="$(api POST /issues "$(jq -nc --argjson config "$template_config" --arg teamId "$TEAM_ID" '$config + {teamId:$teamId,title:(($config.title // "Simulation issue") + " from template") }')")"
templated_identifier="$(jq -er '.identifier' <<<"$templated_issue")"
assert_json 'issue template defaults applied to a real issue' "$templated_issue" \
  --arg label_id "$label_id" \
  '.title == "Simulation issue from template" and .priority.id == "medium" and (.labels | any(.id == $label_id))'

archived_label="$(api PATCH "/labels/$label_id" '{"archived":true}')"
assert_json 'label archive persisted' "$archived_label" '.archivedAt != null'
active_labels="$(api GET "/labels?workspaceId=$WORKSPACE_ID&teamId=$TEAM_ID&includeArchived=false")"
assert_json 'archived label leaves active picker' "$active_labels" --arg label_id "$label_id" 'all(.[]; .id != $label_id)'
archived_labels="$(api GET "/labels?workspaceId=$WORKSPACE_ID&teamId=$TEAM_ID&includeArchived=true")"
assert_json 'archived label remains readable in history catalog' "$archived_labels" --arg label_id "$label_id" 'any(.[]; .id == $label_id and .archivedAt != null)'
restored_label="$(api PATCH "/labels/$label_id" '{"archived":false}')"
assert_json 'label restore persisted' "$restored_label" '.archivedAt == null'

api DELETE "/issues/$root_identifier" >/dev/null
archived_issues="$(api GET "/issues/archived?teamId=$TEAM_ID")"
assert_json 'deleted issue appears in scoped archive' "$archived_issues" --arg root_identifier "$root_identifier" 'any(.[]; .identifier == $root_identifier and .deletedAt != null)'
restored_issue="$(api POST "/issues/$root_identifier/restore")"
assert_json 'deleted issue can be restored' "$restored_issue" --arg root_identifier "$root_identifier" '.identifier == $root_identifier'
restored_detail="$(api GET "/issues/$root_identifier/detail")"
assert_json 'restored issue is readable again' "$restored_detail" --arg root_identifier "$root_identifier" '.identifier == $root_identifier'

echo "PASS authenticated user simulation"
echo "workspace=$WORKSPACE_ID team=$TEAM_ID project=$project_id clonedProject=$cloned_project_id rootIssue=$root_identifier childIssue=$child_identifier templatedIssue=$templated_identifier initiative=$initiative_id cycle=$cycle_id issueTemplate=$issue_template_id"
