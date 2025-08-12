'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Tag,
  Plus,
  Edit,
  Archive,
  Power,
  PowerOff,
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';

interface TaskCategory {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', isActive: true });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: TaskCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      isActive: category.isActive,
    });
    setShowForm(true);
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this category? It will no longer be available for new tasks.')) {
      return;
    }
    
    setActionLoading(`archive-${id}`);
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive category');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive category');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (category: TaskCategory) => {
    setActionLoading(`toggle-${category.id}`);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !category.isActive,
        }),
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Error: {error}</p>
              <Button 
                onClick={fetchCategories}
                variant="outline" 
                size="sm"
              >
                Try again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tag className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Task Categories</h1>
          </div>
          <p className="text-muted-foreground">
            Manage task categories available to families when logging volunteer hours. {categories.length} categories configured.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update the category name and availability status.'
                : 'Create a new task category that families can use when logging volunteer hours.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Classroom Help, Event Setup"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <Label htmlFor="isActive" className="text-sm font-normal">
                Active (visible to families when logging hours)
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingCategory ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {editingCategory ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Categories
            <Badge variant="secondary" className="ml-2">
              {categories.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Task categories help families organize their volunteer work by type of activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No categories found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first category to help families organize their volunteer work.
                    </p>
                    <Button onClick={() => setShowForm(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Category
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} className={!category.isActive ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEdit(category)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => toggleStatus(category)}
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === `toggle-${category.id}`}
                          title={category.isActive ? 'Deactivate category' : 'Activate category'}
                        >
                          {actionLoading === `toggle-${category.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : category.isActive ? (
                            <PowerOff className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Power className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        {category.isActive && (
                          <Button
                            onClick={() => handleArchive(category.id)}
                            size="sm"
                            variant="ghost"
                            disabled={actionLoading === `archive-${category.id}`}
                            title="Archive category"
                          >
                            {actionLoading === `archive-${category.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Archive className="h-4 w-4 text-red-600" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <h3 className="font-medium">Category Management Notes</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li><strong>Active categories</strong> are visible to families when logging volunteer hours</li>
              <li><strong>Inactive categories</strong> are hidden but preserve historical data</li>
              <li><strong>Archived categories</strong> are permanently deactivated and cannot be reactivated</li>
              <li>Consider deactivating instead of archiving to preserve flexibility</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex justify-start">
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}