'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Calendar, Shield, User, Settings, Lock, Users } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-orange-100">
          Welcome back {user?.email}! Manage your system and monitor your account.
        </p>
      </div>

      {/* User Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Admin Status</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              <Badge variant={user?.status === 'active' ? 'default' : 'destructive'} className="bg-orange-600 text-white">
                {user?.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Current account status
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">User ID</CardTitle>
            <User className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate text-slate-800">
              {user?.id?.slice(-8) || 'N/A'}
            </div>
            <p className="text-xs text-slate-500">
              Last 8 characters of your ID
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tenant ID</CardTitle>
            <Building className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate text-slate-800">
              {user?.tenant_id?.slice(-8) || 'N/A'}
            </div>
            <p className="text-xs text-slate-500">
              Your organization identifier
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {formatDate(user?.created_at)?.split(',')[1]?.trim() || 'N/A'}
            </div>
            <p className="text-xs text-slate-500">
              Account creation date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Admin Information</CardTitle>
            <CardDescription className="text-slate-600">
              Your personal account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-700">Email:</span>
              <span className="text-sm text-slate-600">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center p-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-700">User ID:</span>
              <span className="text-sm text-slate-600 font-mono">{user?.id}</span>
            </div>
            <div className="flex justify-between items-center p-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-700">Status:</span>
              <Badge variant={user?.status === 'active' ? 'default' : 'destructive'} className="bg-orange-600 text-white">
                {user?.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="text-sm font-medium text-slate-700">Created:</span>
              <span className="text-sm text-slate-600">
                {formatDate(user?.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800">Quick Actions</CardTitle>
          <CardDescription className="text-slate-600">
            Common tasks and account management options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="p-2 rounded-full bg-orange-100">
                <Settings className="h-4 w-4 text-orange-700" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Profile Settings</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Update your personal information and preferences
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="p-2 rounded-full bg-orange-100">
                <Lock className="h-4 w-4 text-orange-700" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Security</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your password and security settings
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="p-2 rounded-full bg-orange-100">
                <Users className="h-4 w-4 text-orange-700" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Organization</h4>
                <p className="text-xs text-slate-500 mt-1">
                  View and manage your organization settings
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}