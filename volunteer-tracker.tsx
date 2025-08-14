"use client"

import type React from "react"

import { useState } from "react"
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

// Mock admin-defined values
const ANNUAL_GOAL = 20 // hours
const HOURLY_RATE = 25 // dollars
const TASK_CATEGORIES = [
  "Classroom Helper",
  "Field Trip Chaperone",
  "School Event",
  "Fundraising",
  "Library Helper",
  "Other",
]

interface Task {
  id: string
  date: string
  hours: number
  category: string
  description: string
  firstName: string
  createdAt: Date
}

export default function VolunteerTracker() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    hours: "",
    minutes: "0",
    category: "",
    description: "",
  })

  // Calculate totals
  const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0)
  const remainingHours = Math.max(0, ANNUAL_GOAL - totalHours)
  const remainingFee = remainingHours * HOURLY_RATE
  const progressPercentage = Math.min(100, (totalHours / ANNUAL_GOAL) * 100)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.hours || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const totalHours = Number.parseInt(formData.hours) + Number.parseInt(formData.minutes) / 60

    const newTask: Task = {
      id: Date.now().toString(),
      date: formData.date,
      hours: totalHours,
      category: formData.category,
      description: formData.description,
      firstName: "User",
      createdAt: new Date(),
    }

    setTasks([newTask, ...tasks])
    setFormData({
      date: new Date().toISOString().split("T")[0],
      hours: "",
      minutes: "0",
      category: "",
      description: "",
    })

    toast({
      title: "Task Added",
      description: `Successfully logged ${formatHours(totalHours)} for ${newTask.category}.`,
    })
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingTask) return

    setTasks(tasks.map((task) => (task.id === editingTask.id ? editingTask : task)))
    setIsEditDialogOpen(false)
    setEditingTask(null)

    toast({
      title: "Task Updated",
      description: "Your volunteer hours have been updated successfully.",
    })
  }

  const handleDelete = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
    toast({
      title: "Task Deleted",
      description: "The volunteer task has been removed.",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatHours = (hours: number) => {
    if (hours === 1) return "1 hour"
    if (hours < 1) {
      const minutes = hours * 60
      return `${minutes} minutes`
    }
    return `${hours} hours`
  }

  const getHoursAndMinutes = (decimalHours: number) => {
    const hours = Math.floor(decimalHours)
    const minutes = Math.round((decimalHours - hours) * 60)
    return { hours, minutes }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Volunteer Hour Tracker</h1>
          <p className="mt-2 text-gray-600">Track your family's volunteer hours for the academic year</p>
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
                    {totalHours} / {ANNUAL_GOAL} hours
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {totalHours >= ANNUAL_GOAL && (
                <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Congratulations! You've reached your volunteer goal!</span>
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
                    {TASK_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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

              <Button type="submit" className="w-full">
                Log Volunteer Hours
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
                      <th className="text-left p-3 font-medium text-gray-900">Name</th>
                      <th className="text-left p-3 font-medium text-gray-900">Hours</th>
                      <th className="text-left p-3 font-medium text-gray-900">Category</th>
                      <th className="text-left p-3 font-medium text-gray-900">Description</th>
                      <th className="text-center p-3 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-600">{formatDate(task.date)}</td>
                        <td className="p-3 text-sm font-medium text-gray-900">{task.firstName}</td>
                        <td className="p-3">
                          <Badge variant="secondary">{formatHours(task.hours)}</Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-900">{task.category}</td>
                        <td className="p-3 text-sm text-gray-600 max-w-xs truncate">{task.description || "—"}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
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
                    value={editingTask.date}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    type="text"
                    value={editingTask.firstName}
                    onChange={(e) => setEditingTask({ ...editingTask, firstName: e.target.value })}
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
                        const newHours = Number.parseInt(e.target.value) || 0
                        const currentMinutes = getHoursAndMinutes(editingTask.hours).minutes
                        setEditingTask({ ...editingTask, hours: newHours + currentMinutes / 60 })
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
                          variant={editingTask.minutes === minute.toString() ? "default" : "outline"}
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => setEditingTask({ ...editingTask, minutes: minute.toString() })}
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
                    value={editingTask.category}
                    onValueChange={(value) => setEditingTask({ ...editingTask, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingTask.description}
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
