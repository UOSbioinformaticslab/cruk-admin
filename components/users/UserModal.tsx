'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  extractApiErrorMessage,
  normalizeUserFields,
  unwrapPaginatedList,
} from '@/lib/api-response';
import { canManageUserAssignments, getAuthUser } from '@/lib/auth-session';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
}

interface UserMeta {
  sector_id: number;
  mongo_id: number;
  mongo_object_id: string;
  provider?: string;
}

const emptyForm = {
  firstname: '',
  lastname: '',
  email: '',
  secondary_email: '',
  preferred_email: 'primary',
  password: '',
  sector_id: '1',
  organisation: '',
  bio: '',
  domain: '',
  link: '',
  orcid: '',
  contact_feedback: false,
  contact_news: false,
};

const defaultMeta: UserMeta = {
  sector_id: 1,
  mongo_id: 0,
  mongo_object_id: '',
  provider: 'cruk',
};

function buildUserPayload(
  formData: typeof emptyForm,
  meta: UserMeta,
  options: { includePassword?: boolean; userId?: number }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    firstname: formData.firstname,
    lastname: formData.lastname,
    email: formData.email,
    secondary_email: formData.secondary_email || null,
    preferred_email: formData.preferred_email || 'primary',
    sector_id: parseInt(formData.sector_id, 10) || meta.sector_id,
    organisation: formData.organisation || '',
    bio: formData.bio || '',
    domain: formData.domain || '',
    link: formData.link || '',
    orcid: formData.orcid || '',
    contact_feedback: Boolean(formData.contact_feedback),
    contact_news: Boolean(formData.contact_news),
    mongo_id: meta.mongo_id ?? 0,
    mongo_object_id: meta.mongo_object_id || null,
    terms: false,
    is_nhse_sde_approval: false,
  };

  if (options.userId != null) {
    payload.id = options.userId;
  }
  if (meta.provider) {
    payload.provider = meta.provider;
  }
  if (options.includePassword && formData.password) {
    payload.password = formData.password;
  }

  return payload;
}

async function syncUserRoles(
  userId: number,
  initialRoleIds: number[],
  selectedRoleIds: number[],
  allRoles: { id: number; name: string }[]
) {
  const toName = (id: number) => allRoles.find((r) => r.id === id)?.name;
  const initialNames = new Set(
    initialRoleIds.map(toName).filter((n): n is string => Boolean(n))
  );
  const selectedNames = new Set(
    selectedRoleIds.map(toName).filter((n): n is string => Boolean(n))
  );

  if (initialNames.size === 0 && selectedNames.size > 0) {
    try {
      await apiClient.assignUserRoles(userId, [...selectedNames]);
    } catch {
      const changes: Record<string, boolean> = {};
      for (const name of selectedNames) {
        changes[name] = true;
      }
      await apiClient.updateUserRoles(userId, changes);
    }
    return;
  }

  const changes: Record<string, boolean> = {};
  for (const role of allRoles) {
    const was = initialNames.has(role.name);
    const now = selectedNames.has(role.name);
    if (was !== now) {
      changes[role.name] = now;
    }
  }

  if (Object.keys(changes).length > 0) {
    await apiClient.updateUserRoles(userId, changes);
  }
}

const DEFAULT_TEAM_ROLE_NAMES = ['developer', 'metadata.editor', 'custodian.metadata.manager'];

function pickDefaultTeamRoles(allRoles: { name: string }[]): string[] {
  for (const name of DEFAULT_TEAM_ROLE_NAMES) {
    if (allRoles.some((r) => r.name === name)) {
      return [name];
    }
  }
  const fallback = allRoles[0]?.name;
  if (fallback) return [fallback];
  throw new Error('No roles are available to assign when adding a user to a team');
}

async function syncUserTeams(
  userId: number,
  initialTeamIds: number[],
  selectedTeamIds: number[],
  allRoles: { name: string }[]
) {
  const toAdd = selectedTeamIds.filter((id) => !initialTeamIds.includes(id));
  const toRemove = initialTeamIds.filter((id) => !selectedTeamIds.includes(id));
  const defaultTeamRoles = pickDefaultTeamRoles(allRoles);

  for (const teamId of toAdd) {
    await apiClient.addUserToTeam(teamId, userId, defaultTeamRoles);
  }
  for (const teamId of toRemove) {
    await apiClient.removeUserFromTeam(teamId, userId);
  }
}

function resolveCreatedUserId(response: unknown): number {
  if (typeof response === 'number') return response;
  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    if (typeof record.data === 'number') return record.data;
  }
  throw new Error('Could not determine new user id from API response');
}

function idsChanged(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return true;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.some((id, i) => id !== sortedB[i]);
}

export function UserModal({ user, onClose }: UserModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [userMeta, setUserMeta] = useState<UserMeta>(defaultMeta);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [initialTeamIds, setInitialTeamIds] = useState<number[]>([]);
  const [initialRoleIds, setInitialRoleIds] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();
  const [authUser] = useState<User | null>(() => getAuthUser());
  const canViewFullDetails =
    !!user?.id && (user.id === authUser?.id || canManageUserAssignments(authUser));
  const canEditUser =
    !user?.id || user.id === authUser?.id || canManageUserAssignments(authUser);

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => apiClient.getTeams({ per_page: 500 }),
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => apiClient.getRoles({ per_page: 500 }),
  });

  const {
    data: userDetail,
    isLoading: userDetailLoading,
    isError: userDetailError,
    error: userDetailFetchError,
  } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => apiClient.getUser(user!.id),
    enabled: canViewFullDetails,
  });

  const { items: teams } = unwrapPaginatedList<{ id: number; name: string }>(teamsData);
  const { items: roles } = unwrapPaginatedList<{ id: number; name: string; full_name?: string }>(
    rolesData
  );

  useEffect(() => {
    if (!user) {
      setFormData(emptyForm);
      setUserMeta(defaultMeta);
      setSelectedTeamIds([]);
      setSelectedRoleIds([]);
      setInitialTeamIds([]);
      setInitialRoleIds([]);
      return;
    }

    const source = (userDetail as User | undefined) ?? user;
    const normalized = normalizeUserFields(source) as User;
    const teamIds = normalized.teams?.map((t) => t.id) ?? [];
    const roleIds = normalized.roles?.map((r) => r.id) ?? [];

    setFormData({
      firstname: normalized.firstname || '',
      lastname: normalized.lastname || '',
      email: normalized.email || '',
      secondary_email: normalized.secondary_email || '',
      preferred_email: normalized.preferred_email || 'primary',
      password: '',
      sector_id: normalized.sector_id?.toString() || '1',
      organisation: normalized.organisation || '',
      bio: normalized.bio || '',
      domain: normalized.domain || '',
      link: normalized.link || '',
      orcid: normalized.orcid || '',
      contact_feedback: normalized.contact_feedback || false,
      contact_news: normalized.contact_news || false,
    });
    setUserMeta({
      sector_id: normalized.sector_id ?? 1,
      mongo_id: (normalized as User & { mongo_id?: number }).mongo_id ?? 0,
      mongo_object_id:
        (normalized as User & { mongo_object_id?: string }).mongo_object_id ?? '',
      provider: normalized.provider || 'cruk',
    });
    setSelectedTeamIds(teamIds);
    setSelectedRoleIds(roleIds);
    setInitialTeamIds(teamIds);
    setInitialRoleIds(roleIds);
  }, [user, userDetail]);

  const toggleTeam = (teamId: number) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSaving(true);

    try {
      if (user) {
        const payload = buildUserPayload(formData, userMeta, { userId: user.id });
        await apiClient.updateUser(user.id, payload);

        const teamsChanged = idsChanged(initialTeamIds, selectedTeamIds);
        const rolesChanged = idsChanged(initialRoleIds, selectedRoleIds);

        if (teamsChanged || rolesChanged) {
          const syncErrors: string[] = [];

          if (rolesChanged) {
            try {
              await syncUserRoles(user.id, initialRoleIds, selectedRoleIds, roles);
            } catch (syncErr: unknown) {
              syncErrors.push(`Roles: ${extractApiErrorMessage(syncErr)}`);
            }
          }

          if (teamsChanged) {
            try {
              await syncUserTeams(user.id, initialTeamIds, selectedTeamIds, roles);
            } catch (syncErr: unknown) {
              syncErrors.push(`Teams: ${extractApiErrorMessage(syncErr)}`);
            }
          }

          if (syncErrors.length > 0) {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', user.id] });
            setSubmitError(`User profile updated, but ${syncErrors.join('. ')}`);
            return;
          }
        }
      } else {
        const payload = buildUserPayload(formData, userMeta, { includePassword: true });
        const response = await apiClient.createUser(payload);
        const newUserId = resolveCreatedUserId(response);

        if (selectedRoleIds.length > 0) {
          const roleNames = selectedRoleIds
            .map((id) => roles.find((r) => r.id === id)?.name)
            .filter((n): n is string => Boolean(n));
          if (roleNames.length > 0) {
            await apiClient.assignUserRoles(newUserId, roleNames);
          }
        }
        for (const teamId of selectedTeamIds) {
          await apiClient.addUserToTeam(teamId, newUserId, pickDefaultTeamRoles(roles));
        }
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      }
      onClose();
    } catch (err: unknown) {
      setSubmitError(extractApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const detailLoading = !!user && userDetailLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{user ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {submitError}
            </div>
          )}
          {!!user?.id && !canViewFullDetails && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
              You don&apos;t have permission to view full details for this user. Showing available data.
            </div>
          )}
          {!!user?.id && !canEditUser && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
              You don&apos;t have permission to edit this user.
            </div>
          )}
          {userDetailError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
              Could not load full user details. Showing available data.
              {userDetailFetchError instanceof Error && ` (${userDetailFetchError.message})`}
            </div>
          )}
          {detailLoading && (
            <p className="text-sm text-gray-500">Loading user details…</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={detailLoading || !canEditUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={detailLoading || !canEditUser}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!canEditUser}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Email</label>
            <input
              type="email"
              value={formData.secondary_email}
              onChange={(e) => setFormData({ ...formData, secondary_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!canEditUser}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
              <input
                type="text"
                value={formData.organisation}
                onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!canEditUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector ID</label>
              <input
                type="number"
                required
                min={1}
                value={formData.sector_id}
                onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!canEditUser}
              />
            </div>
          </div>
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                {teamsLoading ? (
                  <p className="text-sm text-gray-500">Loading teams…</p>
                ) : teams.length === 0 ? (
                  <p className="text-sm text-gray-500">No teams available</p>
                ) : (
                  teams.map((team) => (
                    <label key={team.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        disabled={detailLoading || saving || !canEditUser}
                      />
                      <span className="text-sm text-gray-800">{team.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                {rolesLoading ? (
                  <p className="text-sm text-gray-500">Loading roles…</p>
                ) : roles.length === 0 ? (
                  <p className="text-sm text-gray-500">No roles available</p>
                ) : (
                  roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        disabled={detailLoading || saving || !canEditUser}
                      />
                      <span className="text-sm text-gray-800">
                        {role.full_name || role.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || detailLoading || !canEditUser}>
              {saving ? 'Saving…' : user ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
