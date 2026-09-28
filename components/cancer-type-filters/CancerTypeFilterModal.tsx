'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CancerTypeFilter } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface CancerTypeFilterModalProps {
  filter: CancerTypeFilter | null;
  allFilters: CancerTypeFilter[];
  onClose: () => void;
}

function flattenFilters(filters: CancerTypeFilter[]): CancerTypeFilter[] {
  const result: CancerTypeFilter[] = [];
  const walk = (items: CancerTypeFilter[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) walk(item.children);
    }
  };
  walk(filters);
  return result;
}

function collectDescendantIds(filter: CancerTypeFilter): Set<number> {
  const ids = new Set<number>();
  const walk = (items: CancerTypeFilter[]) => {
    for (const item of items) {
      ids.add(item.id);
      if (item.children?.length) walk(item.children);
    }
  };
  if (filter.children?.length) walk(filter.children);
  return ids;
}

const emptyForm = {
  filter_id: '',
  label: '',
  category: '',
  primary_group: '',
  count: '',
  parent_id: '',
  level: 0,
  sort_order: '',
};

export function CancerTypeFilterModal({
  filter,
  allFilters,
  onClose,
}: CancerTypeFilterModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const queryClient = useQueryClient();

  const flatFilters = useMemo(() => flattenFilters(allFilters), [allFilters]);

  const excludedParentIds = useMemo(() => {
    if (!filter) return new Set<number>();
    const ids = collectDescendantIds(filter);
    ids.add(filter.id);
    return ids;
  }, [filter]);

  const parentOptions = flatFilters.filter((f) => !excludedParentIds.has(f.id));

  useEffect(() => {
    if (filter) {
      setFormData({
        filter_id: filter.filter_id || '',
        label: filter.label || '',
        category: filter.category || '',
        primary_group: filter.primary_group || '',
        count: filter.count || '',
        parent_id: filter.parent_id?.toString() || '',
        level: filter.level ?? 0,
        sort_order: filter.sort_order?.toString() || '',
      });
    } else {
      setFormData(emptyForm);
    }
  }, [filter]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createCancerTypeFilter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancer-type-filters'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiClient.updateCancerTypeFilter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancer-type-filters'] });
      onClose();
    },
  });

  const handleParentChange = (parentId: string) => {
    const parent = parentId ? flatFilters.find((f) => f.id === parseInt(parentId, 10)) : null;
    setFormData({
      ...formData,
      parent_id: parentId,
      level: parent ? parent.level + 1 : 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Record<string, unknown> = {
      filter_id: formData.filter_id,
      label: formData.label,
      level: formData.level,
    };

    if (formData.category) submitData.category = formData.category;
    if (formData.primary_group) submitData.primary_group = formData.primary_group;
    if (formData.count) submitData.count = formData.count;
    if (formData.parent_id) submitData.parent_id = parseInt(formData.parent_id, 10);
    if (formData.sort_order) submitData.sort_order = parseInt(formData.sort_order, 10);

    if (filter) {
      updateMutation.mutate({ id: filter.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {filter ? 'Edit Cancer Type Filter' : 'Add Cancer Type Filter'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mutationError instanceof Error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {mutationError.message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter ID</label>
            <input
              type="text"
              required
              value={formData.filter_id}
              onChange={(e) => setFormData({ ...formData, filter_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Group</label>
              <input
                type="text"
                value={formData.primary_group}
                onChange={(e) => setFormData({ ...formData, primary_group: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
              <input
                type="text"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
            <select
              value={formData.parent_id}
              onChange={(e) => handleParentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">None (root level)</option>
              {parentOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {'\u00A0'.repeat(f.level * 2)}
                  {f.label} ({f.filter_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <input
              type="number"
              required
              min={0}
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {filter ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
