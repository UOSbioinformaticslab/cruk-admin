'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Team } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface TeamModalProps {
  team: Team | null;
  onClose: () => void;
}

export function TeamModal({ team, onClose }: TeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    enabled: true,
    allows_messaging: false,
    workflow_enabled: false,
    access_requests_management: false,
    uses_5_safes: false,
    is_admin: false,
    member_of: '',
    contact_point: '',
    is_question_bank: false,
    is_provider: false,
    url: '',
    introduction: '',
    service: '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        enabled: team.enabled ?? true,
        allows_messaging: team.allows_messaging || false,
        workflow_enabled: team.workflow_enabled || false,
        access_requests_management: team.access_requests_management || false,
        uses_5_safes: team.uses_5_safes || false,
        is_admin: team.is_admin || false,
        member_of: team.member_of || '',
        contact_point: team.contact_point || '',
        is_question_bank: team.is_question_bank || false,
        is_provider: team.is_provider || false,
        url: team.url || '',
        introduction: team.introduction || '',
        service: team.service || '',
      });
    }
  }, [team]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiClient.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      application_form_updated_by: 0,
      notifications: [],
      users: [],
    };

    if (team) {
      updateMutation.mutate({ id: team.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{team ? 'Edit Team' : 'Create Team'}</h2>
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Of</label>
            <input
              type="text"
              value={formData.member_of}
              onChange={(e) => setFormData({ ...formData, member_of: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Point</label>
            <input
              type="email"
              value={formData.contact_point}
              onChange={(e) => setFormData({ ...formData, contact_point: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Introduction</label>
            <textarea
              value={formData.introduction}
              onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_provider}
                onChange={(e) => setFormData({ ...formData, is_provider: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Is Provider</span>
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {team ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

