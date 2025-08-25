'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    console.log('=== CREDENTIAL RESPONSE RECEIVED ===');
    console.log('Credential length:', response.credential?.length);
    setIsProcessing(true);

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
        setIsProcessing(false);

      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
      setIsProcessing(false);

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

//   return (
//   <div className="w-full relative" aria-busy={isProcessing}>
//     <div ref={buttonRef} className="w-full min-h-[40px]" />
//     {isProcessing && (
//       <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/5 pointer-events-none">
//         <span className="text-sm text-muted-foreground">Signing you in…</span>
//       </div>
//     )}
//   </div>
// );
    return (
  <div className="w-full relative" aria-busy={isProcessing}>
    <div ref={buttonRef} className="w-full min-h-[40px]" />

    {/* Invisible blocker: prevents double-clicks but doesn't cover visuals */}
    {isProcessing && <div className="absolute inset-0 pointer-events-auto" aria-hidden />}

    {/* Status line below the button */}
    {isProcessing && (
      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2"/>
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none"/>
        </svg>
        <span>Signing you in…</span>
      </div>
    )}
  </div>
);

}