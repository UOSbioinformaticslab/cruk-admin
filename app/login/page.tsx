'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { extractApiErrorMessage } from '@/lib/api-response';
import { Button } from '@/components/ui/Button';

const DEFAULT_PROVIDER = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'cruk';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.login(email, password, provider);
      const token = apiClient.getToken();
      if (!token) {
        throw new Error(
          `Login succeeded but no token was returned. Received keys: ${Object.keys(response || {}).join(', ') || '(none)'}`
        );
      }
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err);
      if (message.toLowerCase().includes('invalid credentials')) {
        setError(
          `${message}. Check your email and password, and try the other provider if your account was created as "service" instead of "cruk". Accounts on ${apiUrl} are separate from other environments.`
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">CRUK Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cruk">cruk</option>
              <option value="service">service</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Must match how your account was registered in the API.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          <p>API: {apiUrl}</p>
        </div>
      </div>
    </div>
  );
}
