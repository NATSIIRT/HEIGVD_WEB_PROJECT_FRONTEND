import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { DecodedSecret } from '@/types/secret';

// Auto-lock hook
export const useAutoLock = (onLock: () => void, timeoutMs = 30000) => { // 30000ms = 30s
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onLock, timeoutMs);
  };
  
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer, true));
    resetTimer();
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => document.removeEventListener(event, resetTimer, true));
    };
  }, []);
  
  return resetTimer;
};

// Secure cleanup utility
export const secureCleanup = (pin: string | null, secrets: Map<string, DecodedSecret>) => {
  if (pin && typeof pin === 'string') {
    const randomChars = Array.from({length: pin.length}, () => 
      String.fromCharCode(Math.floor(Math.random() * 94) + 33)
    ).join('');
    
    try {
      (pin as any) = randomChars;
    } catch(e) {
      // String is immutable, best effort
    }
  }
  
  secrets.forEach((secret) => {
    try {
      if (secret.decodedValue) {
        (secret.decodedValue as any) = '*'.repeat(secret.decodedValue.length);
      }
      if (secret.decodedTitle) {
        (secret.decodedTitle as any) = '*'.repeat(secret.decodedTitle.length);
      }
    } catch(e) {
      // Best effort cleanup
    }
  });
  secrets.clear();
};

// Security hook that combines auto-lock and cleanup
export const useSecurity = (
  currentPIN: string | null, 
  decodedSecrets: Map<string, DecodedSecret>,
  setCurrentPIN: (pin: string | null) => void,
  setDecodedSecrets: (secrets: Map<string, DecodedSecret>) => void,
  setIsPINVerified: (verified: boolean) => void,
  setShowPINVerification: (show: boolean) => void
) => {
  const lockSession = () => {
    secureCleanup(currentPIN, decodedSecrets);
    setCurrentPIN(null);
    setDecodedSecrets(new Map());
    setIsPINVerified(false);
    setShowPINVerification(true);
    toast.info("Session verrouillée pour sécurité");
  };
  
  const resetActivityTimer = useAutoLock(lockSession, 30000);

  const manualLock = () => {
    resetActivityTimer();
    lockSession();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      secureCleanup(currentPIN, decodedSecrets);
    };
  }, []);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      secureCleanup(currentPIN, decodedSecrets);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentPIN, decodedSecrets]);

  return { lockSession, resetActivityTimer, manualLock };
};