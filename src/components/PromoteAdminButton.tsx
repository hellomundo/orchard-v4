'use client';

import { useState } from 'react';

export default function PromoteAdminButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const handlePromote = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/promote-admin', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Success! Refreshing page...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to promote user');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={handlePromote}
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : 'Make Me Admin (Debug)'}
      </button>
      {message && (
        <p className="mt-2 text-sm text-center text-gray-600">{message}</p>
      )}
    </div>
  );
}