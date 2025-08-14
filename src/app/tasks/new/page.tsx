'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
}

export default function NewTaskPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

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

      // Redirect to tasks list with success message
      router.push('/tasks?created=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Volunteer Hours</h1>
          <p className="text-gray-600">
            Record a new volunteer task for your family
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>
              Fill out the form below to record your volunteer hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-800">
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              )}

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
                <p className="text-sm text-gray-500">
                  When did this volunteer activity take place?
                </p>
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
                {categories.length === 0 && (
                  <p className="text-sm text-red-500">
                    No categories available. Please contact an administrator.
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you did (e.g., 'Helped set up chairs for the school play', 'Served food at the fundraising dinner')..."
                />
                <p className="text-sm text-gray-500">
                  Provide details about your volunteer activity
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" asChild>
                  <Link href="/tasks">
                    Cancel
                  </Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || categories.length === 0}
                >
                  {submitting ? 'Adding Task...' : 'Add Task'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}