'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RoleToggleButtonProps {
  currentRole?: string;
}

export default function FakeParentButton({ currentRole }: RoleToggleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showDashboardLink, setShowDashboardLink] = useState(false);

  const isAdmin = currentRole === 'admin';
  const targetRole = isAdmin ? 'parent' : 'admin';
  const endpoint = isAdmin ? '/api/debug/fake-parent' : '/api/debug/promote-admin';
  const buttonText = isAdmin ? '👨‍👩‍👧‍👦 Switch to Parent' : '👑 Switch to Admin';

  const handleRoleToggle = async () => {
    setLoading(true);
    setMessage(null);
    setShowDashboardLink(false);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        setShowDashboardLink(true);
        // Refresh the page after a short delay to show the new role
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-medium">
        Current Role: <span className="text-gray-700">{currentRole || 'No role assigned'}</span>
      </div>
      
      <Button
        onClick={handleRoleToggle}
        disabled={loading}
        variant="outline"
        className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
      >
        {loading ? 'Switching...' : buttonText}
      </Button>
      
      {message && (
        <div className={`text-sm p-2 rounded ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700' 
            : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}
      
      {showDashboardLink && (
        <div className="pt-2">
          <Link
            href={targetRole === 'admin' ? '/admin' : '/dashboard'}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to {targetRole === 'admin' ? 'Admin' : 'Family'} Dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}