'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Shield, Calendar, Settings, HelpCircle } from 'lucide-react';

export default function TenantDashboardPage() {
 const { user } = useAuth();
 
 const [tenantStats, setTenantStats] = useState({
   accountAge: 0,
   lastLogin: null as string | null,
   totalSessions: 0
 });

 useEffect(() => {
   // Calculate account age
   if (user?.created_at) {
     const created = new Date(user.created_at);
     const now = new Date();
     const diffTime = Math.abs(now.getTime() - created.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     setTenantStats(prev => ({ ...prev, accountAge: diffDays }));
   }
 }, [user]);

 const formatDate = (dateString?: string) => {
   if (!dateString) return 'N/A';
   return new Date(dateString).toLocaleDateString('en-US', {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
     hour: '2-digit',
     minute: '2-digit'
   });
 };

 return (
   <div className="space-y-6">
     {/* Welcome Section */}
     <div className="bg-white overflow-hidden shadow rounded-lg">
       <div className="px-4 py-5 sm:p-6">
         <div className="flex items-center">
           <div className="flex-shrink-0">
             <User className="h-8 w-8 text-blue-500" />
           </div>
           <div className="ml-5 w-0 flex-1">
             <dl>
               <dt className="text-sm font-medium text-gray-500 truncate">
                 Welcome to your tenant dashboard
               </dt>
               <dd className="text-lg font-medium text-gray-900">
                 {user?.email}
               </dd>
             </dl>
           </div>
         </div>
       </div>
     </div>

     {/* Stats Cards */}
     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
       <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">Account Status</CardTitle>
           <Shield className="h-4 w-4 text-muted-foreground" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold">
             <Badge variant={user?.status === 'active' ? 'default' : 'secondary'}>
               {user?.status?.toUpperCase() || 'ACTIVE'}
             </Badge>
           </div>
         </CardContent>
       </Card>

       <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">Tenant ID</CardTitle>
           <User className="h-4 w-4 text-muted-foreground" />
         </CardHeader>
         <CardContent>
           <div className="text-xl font-bold font-mono">
             {user?.tenant_id?.slice(-8) || 'N/A'}
           </div>
           <p className="text-xs text-muted-foreground">
             Last 8 characters
           </p>
         </CardContent>
       </Card>

       <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">Account Age</CardTitle>
           <Calendar className="h-4 w-4 text-muted-foreground" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold">
             {tenantStats.accountAge}
           </div>
           <p className="text-xs text-muted-foreground">
             Days since creation
           </p>
         </CardContent>
       </Card>

       <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">Access Level</CardTitle>
           <Settings className="h-4 w-4 text-muted-foreground" />
         </CardHeader>
         <CardContent>
           <div className="text-xl font-bold">Tenant</div>
           <p className="text-xs text-muted-foreground">
             Standard access
           </p>
         </CardContent>
       </Card>
     </div>

     {/* Account Information */}
     <div className="grid gap-4 md:grid-cols-2">
       <Card>
         <CardHeader>
           <CardTitle>Account Information</CardTitle>
           <CardDescription>Your tenant account details</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex justify-between items-center">
             <span className="text-sm font-medium">Email:</span>
             <span className="text-sm text-gray-600">{user?.email}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-sm font-medium">Tenant ID:</span>
             <span className="text-sm text-gray-600 font-mono">{user?.tenant_id}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-sm font-medium">Status:</span>
             <Badge variant={user?.status === 'active' ? 'default' : 'secondary'}>
               {user?.status || 'Active'}
             </Badge>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-sm font-medium">Created:</span>
             <span className="text-sm text-gray-600">
               {formatDate(user?.created_at)}
             </span>
           </div>
         </CardContent>
       </Card>

       <Card>
         <CardHeader>
           <CardTitle>Quick Actions</CardTitle>
           <CardDescription>Manage your account and settings</CardDescription>
         </CardHeader>
         <CardContent className="space-y-3">
           <Button variant="outline" className="w-full justify-start">
             <Settings className="mr-2 h-4 w-4" />
             Account Settings
           </Button>
           <Button variant="outline" className="w-full justify-start">
             <Shield className="mr-2 h-4 w-4" />
             Change Password
           </Button>
           <Button variant="outline" className="w-full justify-start">
             <HelpCircle className="mr-2 h-4 w-4" />
             Contact Support
           </Button>
           <Button variant="outline" className="w-full justify-start">
             <User className="mr-2 h-4 w-4" />
             Download Account Data
           </Button>
         </CardContent>
       </Card>
     </div>

     {/* Notice */}
     <Card className="border-blue-200 bg-blue-50">
       <CardContent className="pt-6">
         <div className="flex">
           <div className="flex-shrink-0">
             <Shield className="h-5 w-5 text-blue-400" />
           </div>
           <div className="ml-3">
             <h3 className="text-sm font-medium text-blue-800">
               Tenant Dashboard
             </h3>
             <div className="mt-2 text-sm text-blue-700">
               <p>
                 This is your dedicated tenant portal. You have access to your isolated 
                 account data and tenant-specific features. For additional features or 
                 support, please contact your administrator.
               </p>
             </div>
           </div>
         </div>
       </CardContent>
     </Card>
   </div>
 );
}