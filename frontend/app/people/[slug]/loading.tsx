/**
 * Profile Page Loading State
 * 
 * Displayed while profile data is being fetched
 * Provides immediate visual feedback to users
 */

export default function ProfileLoading() {
  return (
    <div className="profile-loading" role="status" aria-live="polite">
      <div className="container">
        {/* Skeleton Header */}
        <div className="profile-header-skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-text">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-subtitle" />
            <div className="skeleton-line skeleton-location" />
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="profile-content-skeleton">
          <div className="skeleton-main">
            <div className="skeleton-section">
              <div className="skeleton-line skeleton-heading" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </div>
            <div className="skeleton-section">
              <div className="skeleton-line skeleton-heading" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </div>
          </div>
          <div className="skeleton-sidebar">
            <div className="skeleton-card" />
          </div>
        </div>
      </div>

      <span className="visually-hidden">Loading profile...</span>
    </div>
  );
}
