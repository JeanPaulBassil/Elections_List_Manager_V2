'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ALLOWED_ADMINS } from '@/lib/constants';

export default function useAdminAuth() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isAllowed, setIsAllowed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // If no user is logged in, redirect to login
      if (!user) {
        router.push('/admin/login');
        setAuthChecked(true);
        return;
      }

      // Check if user email is in the allowed list
      const userEmail = user.email?.toLowerCase() || '';
      const isAdmin = ALLOWED_ADMINS.some(email => email.toLowerCase() === userEmail);

      if (isAdmin) {
        setIsAllowed(true);
        setAuthChecked(true);
      } else {
        // User is logged in but not allowed
        setIsAllowed(false);
        setAuthChecked(true);
        router.push('/admin/not-authorized');
      }
    }
  }, [user, isLoading, router]);

  return { isAllowed, isLoading: isLoading || !authChecked, user };
} 