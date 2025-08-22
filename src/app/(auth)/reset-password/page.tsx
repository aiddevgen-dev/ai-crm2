'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

// Separate component that uses useSearchParams
function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Link",
        description: "This password reset link is invalid or expired.",
      });
      router.push('/forgot-password');
    }
  }, [searchParams, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid reset token.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.resetPassword({
        token,
        new_password: password,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        });
        router.push('/login');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to reset password. The link may be expired.",
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Invalid Link</CardTitle>
          <CardDescription className="text-center">
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            href="/forgot-password"
            className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-primary"
          >
            Request a new password reset link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
          <Link
            href="/login"
            className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

// Loading component for Suspense fallback
function ResetPasswordLoading() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Loading...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            type="password"
            placeholder="Enter your new password"
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            type="password"
            placeholder="Confirm your new password"
            disabled
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button className="w-full" disabled>
          Loading...
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main component wrapped with Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}