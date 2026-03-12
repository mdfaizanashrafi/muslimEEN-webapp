/**
 * Profile Not Found Page
 * 
 * Displayed when a profile doesn't exist
 * Provides helpful navigation options
 */

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile Not Found - MuslimEEN',
  description: 'The requested profile could not be found. Browse our directory of Muslim professionals.',
};

export default function ProfileNotFound() {
  return (
    <main className="not-found-page">
      <div className="container">
        <div className="not-found-content">
          <h1>Profile Not Found</h1>
          <p>
            We couldn&apos;t find the profile you&apos;re looking for. 
            The user may have removed their profile or the URL might be incorrect.
          </p>
          
          <div className="not-found-actions">
            <Link href="/people" className="btn btn-primary">
              Browse People Directory
            </Link>
            <Link href="/" className="btn btn-outline">
              Go Home
            </Link>
          </div>

          <div className="not-found-suggestions">
            <h2>You might be interested in:</h2>
            <ul>
              <li>
                <Link href="/marketplace/earn">Find jobs in the EARN marketplace</Link>
              </li>
              <li>
                <Link href="/connections">Connect with professionals</Link>
              </li>
              <li>
                <Link href="/islamic-finance">Explore Islamic finance tools</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
