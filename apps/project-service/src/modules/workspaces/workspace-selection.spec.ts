import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  requireExplicitWorkspaceId,
  requireWorkspaceSelection,
} from './workspace-selection';

describe('requireExplicitWorkspaceId', () => {
  it('rejects an unscoped workspace mutation', () => {
    expect(() => requireExplicitWorkspaceId()).toThrow('workspaceId is required');
  });

  it('returns the caller-selected workspace', () => {
    expect(requireExplicitWorkspaceId('workspace-a')).toBe('workspace-a');
  });
});

describe('requireWorkspaceSelection', () => {
  it('infers the only accessible workspace', () => {
    expect(requireWorkspaceSelection(['workspace-a'])).toBe('workspace-a');
  });

  it('requires an explicit workspace for multi-workspace members', () => {
    expect(() => requireWorkspaceSelection(['workspace-a', 'workspace-b'])).toThrow(
      BadRequestException,
    );
  });

  it('accepts an explicitly selected accessible workspace', () => {
    expect(requireWorkspaceSelection(['workspace-a', 'workspace-b'], 'workspace-b')).toBe(
      'workspace-b',
    );
  });

  it('rejects an inaccessible explicit workspace', () => {
    expect(() => requireWorkspaceSelection(['workspace-a'], 'workspace-b')).toThrow(
      NotFoundException,
    );
  });
});
