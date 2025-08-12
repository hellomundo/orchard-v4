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
  Calendar,
  CalendarDays,
  Plus,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface SchoolYear {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  requiredHours: number;
  hourlyRate: number;
  isActive: boolean;
  createdAt: number;
}

export default function SchoolYearsPage() {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    requiredHours: 50,
    hourlyRate: 20.0,
  });

  const fetchSchoolYears = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/school-years');
      if (response.ok) {
        const data = await response.json();
        setSchoolYears(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch school years');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch school years');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/admin/school-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          name: '',
          startDate: '',
          endDate: '',
          requiredHours: 50,
          hourlyRate: 20.0,
        });
        setShowForm(false);
        fetchSchoolYears();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create school year');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create school year');
    } finally {
      setIsCreating(false);
    }
  };

  const activateYear = async (id: string) => {
    if (!confirm('Are you sure you want to activate this school year? This will deactivate the current active year and create family status records for all families.')) {
      return;
    }
    
    setIsActivating(id);
    try {
      const response = await fetch(`/api/admin/school-years/${id}/activate`, {
        method: 'PUT',
      });

      if (response.ok) {
        fetchSchoolYears();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate school year');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate school year');
    } finally {
      setIsActivating(null);
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
                onClick={fetchSchoolYears}
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
            <CalendarDays className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">School Years</h1>
          </div>
          <p className="text-muted-foreground">
            Manage academic years and their settings. {schoolYears.length} school years configured.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add School Year
          </Button>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create New School Year
            </DialogTitle>
            <DialogDescription>
              Set up a new academic year with volunteer hour requirements and penalty rates.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">School Year Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 2024-2025"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requiredHours">Required Hours</Label>
                <Input
                  id="requiredHours"
                  type="number"
                  min="0"
                  value={formData.requiredHours}
                  onChange={(e) => setFormData({ ...formData, requiredHours: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="outline"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create School Year
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
            <Calendar className="h-5 w-5" />
            School Years
            <Badge variant="secondary" className="ml-2">
              {schoolYears.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Academic years with volunteer hour requirements and penalty rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Required Hours</TableHead>
                <TableHead>Penalty Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schoolYears.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No school years found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first school year to start managing volunteer hours.
                    </p>
                    <Button onClick={() => setShowForm(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create School Year
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                schoolYears.map((year) => (
                  <TableRow key={year.id} className={year.isActive ? 'bg-green-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {year.isActive && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {year.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {year.requiredHours} hours
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        ${year.hourlyRate}/hour
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={year.isActive ? 'default' : 'secondary'}>
                        {year.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!year.isActive && (
                        <Button
                          onClick={() => activateYear(year.id)}
                          size="sm"
                          variant="ghost"
                          disabled={isActivating === year.id}
                          className="gap-1"
                        >
                          {isActivating === year.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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