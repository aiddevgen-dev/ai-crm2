'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Calendar, Shield, User } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  useEffect(() => {
    // Log JWT token from cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('auth_token=')
    );
    const token = tokenCookie ? tokenCookie.split('=')[1] : 'No token found';
    
    console.log('=== JWT TOKEN VERIFICATION ===');
    console.log('JWT Token:', token);
    
    // Decode JWT payload (base64 decode the middle part)
    if (token !== 'No token found') {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload:', payload);
        console.log('Token User ID:', payload.user_id);
        console.log('Token Tenant ID:', payload.tenant_id);
        console.log('Token Expires:', new Date(payload.exp * 1000));
      } catch (e) {
        console.log('Failed to decode JWT:', e);
      }
    }
    
    console.log('=== USER CONTEXT DATA ===');
    console.log('Context User Object:', user);
    console.log('Context User ID:', user?.id);
    console.log('Context Tenant ID:', user?.tenant_id);
    console.log('Context Email:', user?.email);
    
    console.log('=== LOCALSTORAGE DATA ===');
    console.log('LS Token:', localStorage.getItem('auth_token'));
    console.log('LS User ID:', localStorage.getItem('user_id'));
    console.log('LS Tenant ID:', localStorage.getItem('tenant_id'));
    console.log('==============================');
  }, [user]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-4xl font-bold tracking-tight">Welcome Admin</h2>
        <p className="text-lg text-muted-foreground mt-2">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>

      {/* User Information Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <Badge variant={user?.status === 'active' ? 'default' : 'destructive'}>
                {user?.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Current account status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User ID</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {user?.id?.slice(-8) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 8 characters of your ID
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant ID</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {user?.tenant_id?.slice(-8) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Your organization identifier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatDate(user?.created_at)?.split(',')[1]?.trim() || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Account creation date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admin&apos;s Information</CardTitle>
            <CardDescription>
              Your personal account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">User ID:</span>
              <span className="text-sm text-muted-foreground font-mono">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={user?.status === 'active' ? 'default' : 'destructive'}>
                {user?.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(user?.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Information about your organization and tenant access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Tenant ID:</span>
              <span className="text-sm text-muted-foreground font-mono">{user?.tenant_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Access Level:</span>
              <Badge variant="outline">Standard User</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Multi-Tenant:</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                You have access to your organization&apos;s isolated data and resources.
              </p>
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and account management options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium">Profile Settings</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Update your personal information and preferences
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium">Security</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Manage your password and security settings
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium">Organization</h4>
              <p className="text-xs text-muted-foreground mt-1">
                View and manage your organization settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}