export function isProjectInInitiativeWorkspace(
  projectWorkspaceId: string | undefined,
  initiativeWorkspaceId: string,
) {
  return projectWorkspaceId === initiativeWorkspaceId;
}
