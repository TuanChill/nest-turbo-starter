import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Workspace-scoped create flows must not guess when the caller belongs to
 * more than one workspace. A single accessible workspace is safe to infer;
 * multiple workspaces require an explicit selection from the client.
 */
export function requireWorkspaceSelection(
  accessibleWorkspaceIds: string[],
  requestedWorkspaceId?: string,
) {
  if (requestedWorkspaceId) {
    if (!accessibleWorkspaceIds.includes(requestedWorkspaceId)) {
      throw new NotFoundException(`Workspace ${requestedWorkspaceId} not found`);
    }
    return requestedWorkspaceId;
  }

  if (accessibleWorkspaceIds.length === 0) {
    throw new NotFoundException('No accessible workspace found');
  }
  if (accessibleWorkspaceIds.length > 1) {
    throw new BadRequestException(
      'workspaceId is required when the member belongs to multiple workspaces',
    );
  }
  return accessibleWorkspaceIds[0];
}
