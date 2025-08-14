'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Task {
  id: string;
  hours: number;
  date: number;
  description: string | null;
  createdAt: number;
  updatedAt: number;
  userId: string;
  category: {
    id: string;
    name: string;
  };
  submittedBy: {
    id: string;
    email: string;
  };
}

export default function TasksPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success messages
  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setSuccessMessage('Task created successfully!');
    } else if (searchParams.get('updated') === 'true') {
      setSuccessMessage('Task updated successfully!');
    }
  }, [searchParams]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    fetchTasks();
  }, [isLoaded]);

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setDeleting(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Remove the task from the local state
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setDeleting(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              <h2 className="text-lg font-medium mb-2">Error</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Volunteer Tasks</h1>
              <p className="text-gray-600">
                View and manage your family's volunteer hour submissions
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                ← Back to Dashboard
              </Link>
            </Button>
          </div>
          <p className="text-sm text-blue-600">
            💡 Add new hours directly from your <Link href="/dashboard" className="underline">Family Dashboard</Link>
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100"
                    onClick={() => setSuccessMessage(null)}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              Your family's volunteer activities this school year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalHours}</div>
                <div className="text-sm text-gray-500">Total Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{tasks.length}</div>
                <div className="text-sm text-gray-500">Total Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {tasks.length > 0 ? (totalHours / tasks.length).toFixed(1) : 0}
                </div>
                <div className="text-sm text-gray-500">Avg Hours/Task</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>
              {tasks.length === 0 
                ? "No tasks recorded yet. Add your first volunteer task to get started."
                : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} recorded`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-500 mb-6">
                  Start tracking your family's volunteer hours by adding tasks from your dashboard.
                </p>
                <Button asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks
                      .sort((a, b) => b.date - a.date)
                      .map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          {new Date(task.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {task.hours}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {task.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {task.description ? (
                            <span className="text-sm text-gray-600">
                              {task.description.length > 50 
                                ? `${task.description.substring(0, 50)}...`
                                : task.description
                              }
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No description</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {task.submittedBy.email}
                            {task.userId === user?.id && (
                              <Badge variant="secondary" className="ml-2">You</Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {task.userId === user?.id && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/tasks/${task.id}/edit`}>
                                    Edit
                                  </Link>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(task.id)}
                                  disabled={deleting === task.id}
                                >
                                  {deleting === task.id ? 'Deleting...' : 'Delete'}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}