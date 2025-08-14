import { auth } from "@clerk/nextjs/server";
import { getCurrentSchoolYear } from "@/lib/schoolYear";
import { getCurrentUserRecord } from "@/lib/auth";
import Link from "next/link";
import FakeParentButton from "@/components/FakeParentButton";

export default async function Home() {
  const { userId } = await auth();
  const currentYear = await getCurrentSchoolYear();
  const user = await getCurrentUserRecord();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Volunteer Hours Management
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Track and manage family volunteer hours for elementary school
          </p>
        </div>

        <div className="mt-12">
          {userId ? (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Welcome back!
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>You're signed in and ready to manage volunteer hours.</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p><strong>User ID:</strong> {userId}</p>
                  <p><strong>Role:</strong> {user?.role || 'No role assigned'}</p>
                  {currentYear && (
                    <p><strong>Current School Year:</strong> {currentYear.name}</p>
                  )}
                </div>
                <div className="mt-5 space-y-3 sm:space-y-0 sm:space-x-3 sm:flex">
                  {user?.role === 'admin' ? (
                    <Link
                      href="/admin"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Family Dashboard
                    </Link>
                  )}
                  <Link
                    href="/unauthorized"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Debug Access (Dev)
                  </Link>
                </div>
                
                {/* Debug Tools */}
                {userId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Tools</h4>
                    <div className="space-y-2">
                      <FakeParentButton currentRole={user?.role} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Get Started
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Sign in to track volunteer hours and manage your family's participation.</p>
                </div>
                <div className="mt-5 space-y-3 sm:space-y-0 sm:space-x-3 sm:flex">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {currentYear && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Current School Year: {currentYear.name}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Required Hours: {currentYear.requiredHours}</p>
                  <p>Penalty Rate: ${currentYear.hourlyRate}/hour</p>
                  <p>Period: {new Date(currentYear.startDate).toLocaleDateString()} - {new Date(currentYear.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
