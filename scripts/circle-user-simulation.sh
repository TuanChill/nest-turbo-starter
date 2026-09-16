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
second_label="$(api POST /labels "$(jq -nc --arg workspaceId "$WORKSPACE_ID" --arg id "sim-label-secondary-$RUN_ID" --arg groupId "$group_id" '{workspaceId:$workspaceId,id:$id,name:"Simulation secondary label",color:"#f2c94c",scope:"both",groupId:$groupId}')")"
second_label_id="$(jq -er '.id' <<<"$second_label")"

project="$(api POST /projects "$(jq -nc --arg teamId "$TEAM_ID" --arg labelId "$label_id" '{name:"Circle simulation project",teamId:$teamId,priorityId:"high",healthId:"on-track",labelIds:[$labelId]}')")"
project_id="$(jq -er '.id' <<<"$project")"

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

root="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" --arg projectId "$project_id" --arg cycleId "$cycle_id" --arg assigneeId "$assignee_id" --arg labelId "$label_id" '{title:"Circle simulation root issue",description:"Authenticated simulation",teamId:$teamId,projectId:$projectId,cycleId:$cycleId,assigneeId:$assigneeId,statusId:"to-do",priorityId:"urgent",labelIds:[$labelId]}')")"
root_identifier="$(jq -er '.identifier' <<<"$root")"
root_id="$(jq -er '.id' <<<"$root")"
mention_id="$(jq -er '.[1].id // .[0].id' <<<"$team_members")"
child="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" --arg parentIssueId "$root_id" --arg projectId "$project_id" --arg cycleId "$cycle_id" '{title:"Circle simulation child issue",teamId:$teamId,parentIssueId:$parentIssueId,projectId:$projectId,cycleId:$cycleId,statusId:"to-do",priorityId:"medium"}')")"
child_identifier="$(jq -er '.identifier' <<<"$child")"
related="$(api POST /issues "$(jq -nc --arg teamId "$TEAM_ID" '{title:"Circle simulation related issue",teamId:$teamId,statusId:"to-do",priorityId:"low"}')")"
related_identifier="$(jq -er '.identifier' <<<"$related")"

api POST "/issues/$root_identifier/relations" "$(jq -nc --arg targetIdentifier "$related_identifier" '{targetIdentifier:$targetIdentifier,relationType:"relates_to"}')" >/dev/null
api POST "/issues/$root_identifier/comments" "$(jq -nc --arg mentionId "$mention_id" '{textContent:("Simulation comment with persisted activity @" + $mentionId)}')" >/dev/null
detail="$(api GET "/issues/$root_identifier/detail")"
activity_id="$(jq -er '.activity[0].id' <<<"$detail")"
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
project_after_delete="$(api DELETE "/projects/$project_id/updates/$second_project_update_id")"
assert_json 'project update deletion rolls health back' "$project_after_delete" --arg update_id "$second_project_update_id" '.health.id == "on-track" and (.updates | all(.[]; .id != $update_id))'
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
assert_json 'parent issue and activity persisted' "$detail" --arg child_identifier "$child_identifier" '.subIssueIds | any(.[]; . == $child_identifier) and (.activity | length) > 0'
assert_json 'relation persisted' "$detail" --arg related_identifier "$related_identifier" '.relations | any(.[]; .identifier == $related_identifier)'
assert_json 'comment mention and reaction persisted' "$detail" 'any(.activity[]; ((.textContent // .text // "") | contains("Simulation comment"))) and any(.activity[]; ((.reactions // []) | length > 0))'
project_detail="$(api GET "/projects/$project_id/detail")"
assert_json 'project update and milestone activity persisted' "$project_detail" '.updates | length >= 1 and .milestones | length >= 1 and .activity | length >= 2'
inbox="$(api GET /inbox)"
assert_json 'inbox returns a persisted collection' "$inbox" 'type == "array"'
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
