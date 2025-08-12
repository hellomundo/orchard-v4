'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  UserCheck, 
  Users, 
  Archive, 
  RotateCcw, 
  Edit, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  Info
} from 'lucide-react';

interface UserWithFamily {
  id: string;
  email: string;
  role: string;
  familyId: string | null;
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
  familyName: string | null;
  familyArchivedAt: number | null;
}

interface Family {
  id: string;
  name: string;
  archivedAt: number | null;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserWithFamily[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithFamily | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchFamilies()]);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilies = async () => {
    try {
      const response = await fetch('/api/admin/families');
      if (!response.ok) throw new Error('Failed to fetch families');
      const data = await response.json();
      // Only get active families for assignment
      setFamilies(data.filter((f: Family) => !f.archivedAt));
    } catch (err) {
      console.error('Failed to fetch families:', err);
    }
  };

  const archiveUser = async (user: UserWithFamily) => {
    if (!confirm(`Are you sure you want to archive "${user.email}"?`)) {
      return;
    }
    
    setIsArchiving(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/archive`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive user');
      }
      
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive user');
    } finally {
      setIsArchiving(null);
    }
  };

  const restoreUser = async (user: UserWithFamily) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/restore`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore user');
      }
      
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore user');
    }
  };

  const updateUserFamily = async () => {
    if (!editingUser) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          familyId: selectedFamilyId || null 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      
      setEditingUser(null);
      setSelectedFamilyId('');
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditingFamily = (user: UserWithFamily) => {
    setEditingUser(user);
    setSelectedFamilyId(user.familyId || '');
  };

  const filteredUsers = users.filter(user => 
    showArchived ? user.archivedAt : !user.archivedAt
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
                onClick={fetchUsers}
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
            <UserCheck className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage user accounts and family assignments. {filteredUsers.length} {showArchived ? 'archived' : 'active'} users.
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
            <Badge variant="secondary" className="ml-2">
              {filteredUsers.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {showArchived ? 'Archived users and their historical data' : 'Active user accounts and family assignments'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={user.archivedAt ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">
                    <span className={user.archivedAt ? 'line-through' : ''}>{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingUser?.id === user.id ? (
                      <Select
                        value={selectedFamilyId}
                        onValueChange={setSelectedFamilyId}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select family" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Family</SelectItem>
                          {families.map((family) => (
                            <SelectItem key={family.id} value={family.id}>
                              {family.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div>
                        {user.familyName ? (
                          <div className="flex items-center gap-2">
                            <span className={user.familyArchivedAt ? 'line-through text-muted-foreground' : ''}>
                              {user.familyName}
                            </span>
                            {user.familyArchivedAt && (
                              <Badge variant="outline" className="text-xs">
                                archived
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No family</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.archivedAt ? 'secondary' : 'default'}>
                      {user.archivedAt ? 'Archived' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingUser?.id === user.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={updateUserFamily}
                          size="sm"
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingUser(null);
                            setSelectedFamilyId('');
                          }}
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => startEditingFamily(user)}
                          size="sm"
                          variant="ghost"
                          disabled={!!user.archivedAt}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.archivedAt ? (
                          <Button
                            onClick={() => restoreUser(user)}
                            size="sm"
                            variant="ghost"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => archiveUser(user)}
                            size="sm"
                            variant="ghost"
                            disabled={user.role === 'admin' || isArchiving === user.id}
                            title={user.role === 'admin' ? 'Cannot archive admin users' : ''}
                          >
                            {isArchiving === user.id ? (
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
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No {showArchived ? 'archived' : 'active'} users found</h3>
              <p className="text-muted-foreground">
                {showArchived 
                  ? 'There are no archived users to display.'
                  : 'Users are created when they sign up through the authentication system.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <h3 className="font-medium">User Management Notes</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Users are created automatically when they sign up through Clerk</li>
              <li>Admin users cannot be archived through this interface</li>
              <li>Archived users cannot log in but their historical data is preserved</li>
              <li>Users assigned to archived families will show a warning</li>
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