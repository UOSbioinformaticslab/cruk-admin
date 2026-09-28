'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test basic connectivity
      const response = await fetch('http://localhost:8100/api/v1/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.text();
      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data.substring(0, 500), // First 500 chars
      });
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setResult({
        error: err.message,
        stack: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithApiClient = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.getUsers({ page: 1, per_page: 1 });
      setResult({ success: true, data });
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setResult({
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
        
        <div className="mb-4 space-y-2">
          <p className="text-sm text-gray-600">
            API URL: <code className="bg-gray-100 px-2 py-1 rounded">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100/api'}</code>
          </p>
          <div className="flex space-x-2">
            <Button onClick={testConnection} disabled={loading}>
              Test Direct Fetch
            </Button>
            <Button onClick={testWithApiClient} disabled={loading}>
              Test API Client
            </Button>
          </div>
        </div>

        {loading && <div className="text-blue-600">Testing connection...</div>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <h2 className="font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}


