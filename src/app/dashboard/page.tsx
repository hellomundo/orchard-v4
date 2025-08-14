"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useUser } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Clock, Edit, Trash2, Target, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  
  // Data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    hours: "",
    minutes: "0",
    category: "",
    description: "",
  });

  // Fetch all data
  const fetchData = async () => {
    if (!isLoaded) return;
    
    try {
      setLoading(true);
      
      // Fetch dashboard data, categories, and tasks in parallel
      const [dashboardResponse, categoriesResponse, tasksResponse] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/categories'),
        fetch('/api/tasks')
      ]);
      
      if (!dashboardResponse.ok || !categoriesResponse.ok || !tasksResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const dashboardData = await dashboardResponse.json();
      const categoriesData = await categoriesResponse.json();
      const tasksData = await tasksResponse.json();
      
      setDashboardData(dashboardData);
      setCategories(categoriesData);
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isLoaded]);

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.hours || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const totalHours = parseInt(formData.hours) + parseInt(formData.minutes) / 60;

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hours: totalHours,
          date: formData.date,
          categoryId: formData.category,
          description: formData.description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        hours: "",
        minutes: "0",
        category: "",
        description: "",
      });

      toast({
        title: "Task Added",
        description: `Successfully logged ${formatHours(totalHours)}.`,
      });

      // Refresh data
      await fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hours: editingTask.hours,
          date: new Date(editingTask.date).toISOString().split('T')[0],
          categoryId: editingTask.category.id,
          description: editingTask.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      setIsEditDialogOpen(false);
      setEditingTask(null);

      toast({
        title: "Task Updated",
        description: "Your volunteer hours have been updated successfully.",
      });

      // Refresh data
      await fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      toast({
        title: "Task Deleted",
        description: "The volunteer task has been removed.",
      });

      // Refresh data
      await fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    }
  };

  // Utility functions
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatHours = (hours: number) => {
    if (hours === 1) return "1 hour";
    if (hours < 1) {
      const minutes = hours * 60;
      return `${minutes} minutes`;
    }
    return `${hours} hours`;
  };

  const getHoursAndMinutes = (decimalHours: number) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return { hours, minutes };
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
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
        <div className="mx-auto max-w-4xl">
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
        <div className="mx-auto max-w-4xl">
          <div className="text-center py-12">
            <h2 className="text-lg font-medium text-gray-900">No data available</h2>
          </div>
        </div>
      </div>
    );
  }

  const { family, schoolYear, progress } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Volunteer Hour Tracker</h1>
          <p className="mt-2 text-gray-600">{family.name} • {schoolYear.name}</p>
        </div>

        {/* Progress Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Hours Completed</span>
                  <span>
                    {progress.totalHours} / {progress.requiredHours} hours
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>

              {progress.totalHours >= progress.requiredHours && (
                <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Congratulations! You've reached your volunteer goal!</span>
                </div>
              )}

              {progress.hoursRemaining > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-sm text-orange-600">Hours Remaining</div>
                    <div className="text-2xl font-bold text-orange-900">{progress.hoursRemaining}</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm text-red-600">Potential Penalty</div>
                    <div className="text-2xl font-bold text-red-900">${progress.penalty.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Log Volunteer Hours</CardTitle>
            <CardDescription>Submit a new volunteer task to track your hours</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours *</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      max="24"
                      placeholder="0"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minutes">Minutes</Label>
                    <div className="flex gap-1">
                      {[0, 15, 30, 45].map((minute) => (
                        <Button
                          key={minute}
                          type="button"
                          variant={formData.minutes === minute.toString() ? "default" : "outline"}
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => setFormData({ ...formData, minutes: minute.toString() })}
                        >
                          :{minute.toString().padStart(2, "0")}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you did..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Adding..." : "Log Volunteer Hours"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Volunteer History</CardTitle>
            <CardDescription>
              {tasks.length === 0
                ? "No volunteer hours logged yet"
                : `${tasks.length} task${tasks.length === 1 ? "" : "s"} logged`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start logging your volunteer hours above!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-900">Date</th>
                      <th className="text-left p-3 font-medium text-gray-900">Submitted By</th>
                      <th className="text-left p-3 font-medium text-gray-900">Hours</th>
                      <th className="text-left p-3 font-medium text-gray-900">Category</th>
                      <th className="text-left p-3 font-medium text-gray-900">Description</th>
                      <th className="text-center p-3 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .sort((a, b) => b.date - a.date)
                      .map((task) => (
                        <tr key={task.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-600">{formatDate(task.date)}</td>
                          <td className="p-3 text-sm font-medium text-gray-900">
                            {task.submittedBy.email}
                            {task.userId === user?.id && (
                              <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">{formatHours(task.hours)}</Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-900">{task.category.name}</td>
                          <td className="p-3 text-sm text-gray-600 max-w-xs truncate">{task.description || "—"}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              {task.userId === user?.id && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(task)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this volunteer task? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(task.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Volunteer Task</DialogTitle>
              <DialogDescription>Make changes to your volunteer hours entry.</DialogDescription>
            </DialogHeader>
            {editingTask && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={new Date(editingTask.date).toISOString().split('T')[0]}
                    onChange={(e) => setEditingTask({ ...editingTask, date: new Date(e.target.value).getTime() })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-hours">Hours</Label>
                    <Input
                      id="edit-hours"
                      type="number"
                      min="0"
                      max="24"
                      value={getHoursAndMinutes(editingTask.hours).hours}
                      onChange={(e) => {
                        const newHours = parseInt(e.target.value) || 0;
                        const currentMinutes = getHoursAndMinutes(editingTask.hours).minutes;
                        setEditingTask({ ...editingTask, hours: newHours + currentMinutes / 60 });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-minutes">Minutes</Label>
                    <div className="flex gap-1">
                      {[0, 15, 30, 45].map((minute) => (
                        <Button
                          key={minute}
                          type="button"
                          variant={getHoursAndMinutes(editingTask.hours).minutes === minute ? "default" : "outline"}
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            const currentHours = getHoursAndMinutes(editingTask.hours).hours;
                            setEditingTask({ ...editingTask, hours: currentHours + minute / 60 });
                          }}
                        >
                          :{minute.toString().padStart(2, "0")}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingTask.category.id}
                    onValueChange={(value) => {
                      const selectedCategory = categories.find(c => c.id === value);
                      if (selectedCategory) {
                        setEditingTask({ 
                          ...editingTask, 
                          category: { id: selectedCategory.id, name: selectedCategory.name }
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingTask.description || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}