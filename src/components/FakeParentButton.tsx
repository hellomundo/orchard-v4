'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function FakeParentButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFakeParent = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/debug/fake-parent', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        // Refresh the page after a short delay to show the new role
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
    <div className="space-y-2">
      <Button
        onClick={handleFakeParent}
        disabled={loading}
        variant="outline"
        className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
      >
        {loading ? 'Setting up...' : '🧪 Debug: Set as Parent'}
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
    </div>
  );
}