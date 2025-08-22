'use client';

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface GoogleSignInProps {
  onSuccess?: () => void;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export function GoogleSignIn({ onSuccess }: GoogleSignInProps) {
  const { toast } = useToast();
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    console.log('=== CREDENTIAL RESPONSE RECEIVED ===');
    console.log('Credential length:', response.credential?.length);

    try {
      const result = await apiClient.googleAuth(response.credential);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Successfully signed in with Google",
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Google sign-in failed",
        });
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  }, [onSuccess, toast]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not found');
      return;
    }

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: buttonRef.current.offsetWidth,
            text: 'continue_with',
            shape: 'rectangular',
          }
        );

        console.log('Google button rendered successfully');
      } else {
        setTimeout(initializeGoogle, 100);
      }
    };

    initializeGoogle();
  }, [handleCredentialResponse]);

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full min-h-[40px]"></div>
    </div>
  );
}