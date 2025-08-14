'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardData {
  family: {
    id: string;
    name: string;
  };
  schoolYear: {
    id: string;
    name: string;
    requiredHours: number;
    hourlyRate: number;
    startDate: number;
    endDate: number;
  };
  progress: {
    totalHours: number;
    requiredHours: number;
    hoursRemaining: number;
    progressPercentage: number;
    penalty: number;
  };
  recentTasks: Array<{
    id: string;
    hours: number;
    date: number;
    description: string | null;
    createdAt: number;
  }>;
}

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    
    const fetchData = async () => {
      try {
        // Fetch dashboard data and categories in parallel
        const [dashboardResponse, categoriesResponse] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/categories')
        ]);
        
        if (!dashboardResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const dashboardData = await dashboardResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        setDashboardData(dashboardData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded]);

  // Form handlers
  const addMinutes = (minutesToAdd: number) => {
    const currentMinutes = parseInt(minutes) || 0;
    const newMinutes = currentMinutes + minutesToAdd;
    
    if (newMinutes >= 60) {
      const hoursToAdd = Math.floor(newMinutes / 60);
      const remainingMinutes = newMinutes % 60;
      setHours(((parseInt(hours) || 0) + hoursToAdd).toString());
      setMinutes(remainingMinutes.toString());
    } else if (newMinutes < 0) {
      if (parseInt(hours) > 0) {
        setHours(((parseInt(hours) || 0) - 1).toString());
        setMinutes((60 + newMinutes).toString());
      } else {
        setMinutes('0');
      }
    } else {
      setMinutes(newMinutes.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      // Convert hours and minutes to decimal hours
      const hoursNum = parseInt(hours) || 0;
      const minutesNum = parseInt(minutes) || 0;
      const totalHours = hoursNum + (minutesNum / 60);

      if (totalHours <= 0) {
        throw new Error('Please enter a valid number of hours');
      }

      if (!categoryId) {
        throw new Error('Please select a category');
      }

      if (!date) {
        throw new Error('Please select a date');
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hours: totalHours,
          date: date,
          categoryId,
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      // Reset form
      setHours('');
      setMinutes('0');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setDescription('');
      
      // Show success message
      setSuccessMessage('Task added successfully!');
      
      // Refresh dashboard data
      const dashboardResponse = await fetch('/api/dashboard');
      if (dashboardResponse.ok) {
        const updatedData = await dashboardResponse.json();
        setDashboardData(updatedData);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded"></div>
                </div>
              ))}
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-lg font-medium text-gray-900">No data available</h2>
          </div>
        </div>
      </div>
    );
  }

  const { family, schoolYear, progress, recentTasks } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
          <p className="text-gray-600">
            {family.name} • {schoolYear.name}
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Hours Completed</CardDescription>
              <CardTitle className="text-3xl">
                {progress.totalHours}
                <span className="text-base font-normal text-gray-500 ml-1">
                  / {progress.requiredHours}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {progress.progressPercentage.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Hours Remaining</CardDescription>
              <CardTitle className="text-3xl">
                {progress.hoursRemaining}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={progress.hoursRemaining > 0 ? "destructive" : "default"}>
                {progress.hoursRemaining > 0 ? "Behind Schedule" : "Goal Met!"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Potential Penalty</CardDescription>
              <CardTitle className="text-3xl">
                ${progress.penalty.toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                ${schoolYear.hourlyRate}/hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>School Year</CardDescription>
              <CardTitle className="text-lg">
                {schoolYear.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {new Date(schoolYear.startDate).toLocaleDateString()} - 
                {' '}{new Date(schoolYear.endDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
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

        {/* Add Hours Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Volunteer Hours</CardTitle>
            <CardDescription>
              Record new volunteer time for your family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-800">
                    <strong>Error:</strong> {formError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hours Input */}
                <div className="space-y-2">
                  <Label htmlFor="hours">Time Spent</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        id="hours"
                        type="number"
                        min="0"
                        max="24"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="0"
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        step="15"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">minutes</span>
                    </div>
                  </div>
                  
                  {/* Quick minute buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addMinutes(15)}
                    >
                      +15 min
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addMinutes(30)}
                    >
                      +30 min
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addMinutes(-15)}
                      disabled={parseInt(hours) === 0 && parseInt(minutes) < 15}
                    >
                      -15 min
                    </Button>
                  </div>

                  <p className="text-sm text-gray-500">
                    Total: {(parseInt(hours) || 0) + ((parseInt(minutes) || 0) / 60)} hours
                  </p>
                </div>

                {/* Date and Category */}
                <div className="space-y-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you did (e.g., 'Helped set up chairs for the school play')..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-between items-center">
                <Button variant="outline" asChild>
                  <Link href="/tasks">
                    View All Tasks
                  </Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || categories.length === 0}
                >
                  {submitting ? 'Adding...' : 'Add Hours'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>
              Your family's most recent volunteer activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tasks recorded yet</p>
                <Button asChild>
                  <Link href="/tasks/new">
                    Add Your First Task
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{task.hours} hours</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">
                          {new Date(task.date).toLocaleDateString()}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {recentTasks.length >= 5 && (
                  <div className="pt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/tasks">
                        View All Tasks
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}