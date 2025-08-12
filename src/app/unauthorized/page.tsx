import { getCurrentUserRecord } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import PromoteAdminButton from '@/components/PromoteAdminButton';

export default async function UnauthorizedPage() {
  const { userId } = await auth();
  const user = await getCurrentUserRecord();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You don't have permission to access the admin area.
          </p>
        </div>
        
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Debug Information
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div>
                <strong>Clerk User ID:</strong> {userId || 'Not found'}
              </div>
              <div>
                <strong>Database Record:</strong> {user ? 'Found' : 'Not found'}
              </div>
              <div>
                <strong>Current Role:</strong> {user?.role || 'No role assigned'}
              </div>
              <div>
                <strong>Email:</strong> {user?.email || 'Not available'}
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                To make this user an admin, run the following in your database:
              </p>
              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                <code className="text-sm font-mono">
                  UPDATE users SET role = 'admin' WHERE id = '{userId}';
                </code>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <PromoteAdminButton />
              <a
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}