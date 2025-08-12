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
  Users, 
  UserPlus, 
  Edit, 
  Archive, 
  RotateCcw, 
  Plus, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  archivedAt: number | null;
}

interface Family {
  id: string;
  name: string;
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
  users: User[];
}

export default function FamiliesManagement() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isArchiving, setIsArchiving] = useState<string | null>(null);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/families');
      if (!response.ok) throw new Error('Failed to fetch families');
      const data = await response.json();
      setFamilies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch families');
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async () => {
    if (!newFamilyName.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFamilyName.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create family');
      }
      
      setNewFamilyName('');
      setShowCreateModal(false);
      fetchFamilies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create family');
    } finally {
      setIsCreating(false);
    }
  };

  const updateFamily = async () => {
    if (!editingFamily || !editingName.trim()) return;
    
    try {
      const response = await fetch(`/api/admin/families/${editingFamily.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update family');
      }
      
      setEditingFamily(null);
      setEditingName('');
      fetchFamilies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update family');
    }
  };

  const archiveFamily = async (family: Family) => {
    if (!confirm(`Are you sure you want to archive "${family.name}"? This will also archive all users in this family.`)) {
      return;
    }
    
    setIsArchiving(family.id);
    try {
      const response = await fetch(`/api/admin/families/${family.id}/archive`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive family');
      }
      
      fetchFamilies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive family');
    } finally {
      setIsArchiving(null);
    }
  };

  const restoreFamily = async (family: Family) => {
    try {
      const response = await fetch(`/api/admin/families/${family.id}/restore`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore family');
      }
      
      fetchFamilies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore family');
    }
  };

  const startEditing = (family: Family) => {
    setEditingFamily(family);
    setEditingName(family.name);
  };

  const filteredFamilies = families.filter(family => 
    showArchived ? family.archivedAt : !family.archivedAt
  );

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
                onClick={fetchFamilies}
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
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Family Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage family accounts and their members. {filteredFamilies.length} {showArchived ? 'archived' : 'active'} families.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowArchived(!showArchived)}
            variant="outline"
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Family
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Families
            <Badge variant="secondary" className="ml-2">
              {filteredFamilies.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {showArchived ? 'Archived families and their historical data' : 'Active family accounts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFamilies.map((family) => (
                <TableRow key={family.id} className={family.archivedAt ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    {editingFamily?.id === family.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="max-w-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateFamily();
                          if (e.key === 'Escape') {
                            setEditingFamily(null);
                            setEditingName('');
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={family.archivedAt ? 'line-through' : ''}>{family.name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {family.users.length === 0 ? (
                        <span className="text-muted-foreground">No members</span>
                      ) : (
                        family.users.map((user) => (
                          <div key={user.id} className="flex items-center gap-2">
                            <span className={user.archivedAt ? 'text-muted-foreground line-through' : 'text-sm'}>
                              {user.email}
                            </span>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                              {user.role}
                            </Badge>
                            {user.archivedAt && (
                              <Badge variant="outline" className="text-xs">
                                archived
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={family.archivedAt ? 'secondary' : 'default'}>
                      {family.archivedAt ? 'Archived' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(family.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingFamily?.id === family.id ? (
                      <div className="flex justify-end gap-2">
                        <Button onClick={updateFamily} size="sm" variant="default">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFamily(null);
                            setEditingName('');
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => startEditing(family)}
                          size="sm"
                          variant="ghost"
                          disabled={!!family.archivedAt}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {family.archivedAt ? (
                          <Button
                            onClick={() => restoreFamily(family)}
                            size="sm"
                            variant="ghost"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => archiveFamily(family)}
                            size="sm"
                            variant="ghost"
                            disabled={isArchiving === family.id}
                          >
                            {isArchiving === family.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredFamilies.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No {showArchived ? 'archived' : 'active'} families found</h3>
              <p className="text-muted-foreground mb-4">
                {showArchived 
                  ? 'There are no archived families to display.'
                  : 'Get started by creating your first family account.'
                }
              </p>
              {!showArchived && (
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create your first family
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New Family
            </DialogTitle>
            <DialogDescription>
              Add a new family to the volunteer hour management system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="Enter family name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFamilyName.trim()) createFamily();
                  if (e.key === 'Escape') {
                    setShowCreateModal(false);
                    setNewFamilyName('');
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowCreateModal(false);
                setNewFamilyName('');
              }}
              variant="outline"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={createFamily}
              disabled={!newFamilyName.trim() || isCreating}
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
                  Create Family
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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