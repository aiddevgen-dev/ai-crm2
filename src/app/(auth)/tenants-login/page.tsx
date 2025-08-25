'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ai-crm2-backend2.onrender.com'
  : 'http://127.0.0.1:5000';

export default function TenantLoginPage() {
  const [tenantId, setTenantId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenant-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          password: password,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Store tenant auth token
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('tenant_info', JSON.stringify(result.tenant));
        // Store user info in the same format as admin login
localStorage.setItem('user_id', result.user.tenant_id);
localStorage.setItem('tenant_id', result.user.tenant_id);
localStorage.setItem('user_email', result.user.email);
        
        toast({
          title: "Welcome!",
          description: "You have been logged in successfully.",
        });
        
        // Redirect to tenant dashboard
        window.location.href = '/tenant-dashboard';
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.error || "Invalid credentials. Please check your Tenant ID and password.",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to MultiTenants AI
          </h1>
          <p className="text-lg text-gray-600">
            Tenant Portal Login
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your Tenant ID and password to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant ID</Label>
                <Input
                  id="tenantId"
                  type="text"
                  placeholder="Enter your Tenant ID"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Your Tenant ID was provided in your welcome email
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-end">
                {/* <Link
                  href="/tenant-auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
                >
                  Forgot your password?
                </Link> */}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Need help? Contact your administrator from mail you received
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            This is the tenant portal. If you&apos;re an administrator,{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              click here to access the admin portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}