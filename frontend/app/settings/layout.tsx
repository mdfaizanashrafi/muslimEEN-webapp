'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import '@/styles/settings.css';

interface SettingsNavItem {
  href: string;
  label: string;
  icon: string;
}

const settingsNavItems: SettingsNavItem[] = [
  { href: '/settings/account', label: 'Account', icon: '👤' },
  { href: '/settings/security', label: 'Sign in & Security', icon: '🔒' },
  { href: '/settings/privacy', label: 'Privacy', icon: '🔐' },
  { href: '/settings/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/settings/visibility', label: 'Visibility', icon: '👁️' },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <AppLayout activeNav="settings">
      <div className="settings-page">
        <div className="settings-container">
          {/* Sidebar Navigation */}
          <aside className="settings-sidebar">
            <nav className="settings-nav">
              <h2 className="settings-nav-title">Settings</h2>
              <ul className="settings-nav-list">
                {settingsNavItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`settings-nav-link ${pathname === item.href ? 'active' : ''}`}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="settings-content">
            {children}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
