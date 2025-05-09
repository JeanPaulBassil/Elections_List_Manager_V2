'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Get current path
  const pathname = usePathname();
  
  // Pages that don't need auth check
  const publicPages = ['/admin/login', '/admin/not-authorized'];
  
  // Allow rendering without checks for login and not-authorized pages
  if (publicPages.some(page => pathname === page)) {
    return <>{children}</>;
  }
  
  // For all other admin pages, the children component (page) is responsible for auth checks
  // using the useAdminAuth hook
  return <>{children}</>;
} 