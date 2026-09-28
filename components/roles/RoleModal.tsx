'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Role } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface RoleModalProps {
  role: Role | null;
  onClose: () => void;
}

export function RoleModal({ role, onClose }: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    full_name: '',
    enabled: true,
    permissions: [] as string[],
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        full_name: role.full_name || '',
        enabled: role.enabled ?? true,
        permissions: role.permissions?.map((p) => p.id.toString()) || [],
      });
    }
  }, [role]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiClient.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      permissions: formData.permissions.map((p) => parseInt(p)),
    };

    if (role) {
      updateMutation.mutate({ id: role.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{role ? 'Edit Role' : 'Create Role'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., custodian.team.admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., TEAM ADMIN"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {role ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


