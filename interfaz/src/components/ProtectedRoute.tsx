'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireVerified?: boolean;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, fallback, requireVerified = true, requireOnboarding = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isVerified, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requireVerified && isAuthenticated && !isVerified) {
      const pendingEmail = localStorage.getItem('pendingEmail');
      const userEmail = localStorage.getItem('userEmail');
      if (pendingEmail || userEmail) {
        router.push('/verificar');
      } else {
        router.push('/registro');
      }
      return;
    }

    if (requireOnboarding && isAuthenticated && isVerified && user?.isFirstLogin) {
      router.push('/onboarding');
    }
  }, [isLoading, isAuthenticated, isVerified, user, router, requireVerified, requireOnboarding]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  if (requireVerified && !isVerified) {
    return fallback ? <>{fallback}</> : null;
  }

  if (requireOnboarding && user?.isFirstLogin) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/inicio');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function VerifiedRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requireVerified={true} requireOnboarding={false}>{children}</ProtectedRoute>;
}

export function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isVerified, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isVerified && !user?.isFirstLogin) {
      router.push('/inicio');
    }
  }, [isLoading, isVerified, user, router]);

  if (isLoading || !isVerified || !user?.isFirstLogin) {
    return null;
  }

  return <>{children}</>;
}
