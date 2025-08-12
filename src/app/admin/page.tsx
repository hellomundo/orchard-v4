import { getCurrentSchoolYear } from '@/lib/schoolYear';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { 
  CalendarDays, 
  Tag, 
  Users, 
  UserCheck, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Settings
} from 'lucide-react';

export default async function AdminDashboard() {
  const currentSchoolYear = await getCurrentSchoolYear();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Manage volunteer hours system for elementary school families
        </p>
      </div>

      {currentSchoolYear ? (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {currentSchoolYear.name}
                </Badge>
                <span className="font-medium">Active School Year</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Required Hours:</span> {currentSchoolYear.requiredHours}
                </div>
                <div>
                  <span className="font-medium">Penalty Rate:</span> ${currentSchoolYear.hourlyRate}/hour
                </div>
                <div>
                  <span className="font-medium">Period:</span> {new Date(currentSchoolYear.startDate).toLocaleDateString()} - {new Date(currentSchoolYear.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <h3 className="font-medium">No Active School Year</h3>
              <p>Please create and activate a school year to begin tracking volunteer hours.</p>
              <Button asChild size="sm" className="mt-2">
                <Link href="/admin/school-years">Set up school year</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Years</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mb-4">
              Manage academic years and settings
            </CardDescription>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/school-years">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Years
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mb-4">
              Manage volunteer task types
            </CardDescription>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/categories">
                <Settings className="h-4 w-4 mr-2" />
                Manage Categories
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Families</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mb-4">
              Manage family accounts
            </CardDescription>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/families">
                <Users className="h-4 w-4 mr-2" />
                Manage Families
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs mb-4">
              Manage user accounts
            </CardDescription>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/users">
                <UserCheck className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Setup
          </CardTitle>
          <CardDescription>
            Complete these steps to set up the volunteer hour management system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {currentSchoolYear ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
              <span className={currentSchoolYear ? 'text-green-600 font-medium' : ''}>
                Create and activate a school year
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-muted" />
              <span>Set up task categories for volunteer activities</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-muted" />
              <span>Create family accounts for school families</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-muted" />
              <span>Assign users to families and manage permissions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-muted" />
              <span>Configure penalty rates and hour requirements</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex gap-2 flex-wrap">
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/school-years">School Years</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/categories">Categories</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/families">Families</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/users">Users</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}