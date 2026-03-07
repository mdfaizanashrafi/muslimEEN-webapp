/**
 * Trust Score Service
 * Following BACKEND_README.md TrustScoreFactors interface
 */

const db = require('../config/database');
const User = require('./user');

class TrustScore {
  static MAX_SCORE = 1000;
  static MIN_SCORE = 0;

  // Points allocation as per BACKEND_README.md
  static POINTS = {
    PROFILE_COMPLETENESS_MAX: 100,
    CONNECTION_QUALITY_MAX: 50,
    COMMUNITY_CONTRIBUTIONS_MAX: 50,
    VERIFICATION_BASIC: 50,
    VERIFICATION_FULL: 100,
    VERIFICATION_BUSINESS: 150,
    ENDORSEMENT_MAX: 100,
    SUCCESSFUL_INVITE: 10,
    FAILED_INVITE: -50
  };

  /**
   * Calculate trust score based on factors
   * Formula: Sum of all factors, capped at 1000
   */
  static calculate(factors) {
    const {
      profileCompleteness = 0,
      connectionQuality = 0,
      communityContributions = 0,
      verificationLevel = 0,
      endorsements = 0,
      successfulInvites = 0,
      failedInvites = 0
    } = factors;

    const score = Math.min(this.MAX_SCORE, Math.max(this.MIN_SCORE,
      profileCompleteness +
      connectionQuality +
      communityContributions +
      verificationLevel +
      endorsements +
      (successfulInvites * this.POINTS.SUCCESSFUL_INVITE) +
      (failedInvites * this.POINTS.FAILED_INVITE)
    ));

    return Math.floor(score);
  }

  /**
   * Calculate profile completeness score
   */
  static calculateProfileCompleteness(user) {
    let score = 0;
    const fields = [
      { field: user.firstName, weight: 10 },
      { field: user.lastName, weight: 10 },
      { field: user.bio, weight: 20 },
      { field: user.location, weight: 15 },
      { field: user.industry, weight: 15 },
      { field: user.skills && user.skills.length > 0, weight: 15 },
      { field: user.workHistory && user.workHistory.length > 0, weight: 15 }
    ];

    fields.forEach(({ field, weight }) => {
      if (field) score += weight;
    });

    return Math.min(this.POINTS.PROFILE_COMPLETENESS_MAX, score);
  }

  /**
   * Get verification level points
   */
  static getVerificationPoints(tier) {
    switch (tier) {
      case 'business': return this.POINTS.VERIFICATION_BUSINESS;
      case 'full': return this.POINTS.VERIFICATION_FULL;
      case 'basic': return this.POINTS.VERIFICATION_BASIC;
      default: return 0;
    }
  }

  /**
   * Recalculate and update user's trust score
   */
  static async recalculate(userId) {
    const user = await User.getFullProfile(userId);
    if (!user) throw new Error('User not found');

    // Get additional metrics
    const metrics = await this.getUserMetrics(userId);

    const factors = {
      profileCompleteness: this.calculateProfileCompleteness(user),
      connectionQuality: Math.min(this.POINTS.CONNECTION_QUALITY_MAX, metrics.connectionQuality),
      communityContributions: Math.min(this.POINTS.COMMUNITY_CONTRIBUTIONS_MAX, metrics.communityContributions),
      verificationLevel: this.getVerificationPoints(user.verificationTier),
      endorsements: Math.min(this.POINTS.ENDORSEMENT_MAX, user.endorsements),
      successfulInvites: metrics.successfulInvites,
      failedInvites: metrics.failedInvites
    };

    const newScore = this.calculate(factors);

    // Update if changed
    if (newScore !== user.trustScore) {
      await User.updateTrustScore(userId, newScore, factors);
      
      // Check witness eligibility
      const isWitnessEligible = newScore >= 200;
      if (isWitnessEligible !== user.isWitnessEligible) {
        await User.update(userId, { is_witness_eligible: isWitnessEligible });
      }
    }

    return {
      score: newScore,
      factors: Object.entries(factors).map(([name, impact]) => ({
        name: this.formatFactorName(name),
        impact,
        positive: impact > 0
      }))
    };
  }

  /**
   * Get user metrics for trust score calculation
   */
  static async getUserMetrics(userId) {
    // Connection quality (based on verified connections)
    const connectionQuery = `
      SELECT COUNT(*) as verified_connections
      FROM connections c
      JOIN users u ON (c.recipient_id = u.id OR c.requester_id = u.id)
      WHERE (c.requester_id = $1 OR c.recipient_id = $1)
        AND c.status = 'accepted'
        AND u.verification_tier IN ('full', 'business')
    `;
    const connectionResult = await db.query(connectionQuery, [userId]);
    const connectionQuality = Math.min(
      this.POINTS.CONNECTION_QUALITY_MAX,
      parseInt(connectionResult.rows[0].verified_connections) * 5
    );

    // Community contributions (witness activities, endorsements given)
    const witnessQuery = `
      SELECT COUNT(*) as witness_count
      FROM verification_witnesses
      WHERE witness_id = $1 AND status = 'approved'
    `;
    const witnessResult = await db.query(witnessQuery, [userId]);
    const communityContributions = Math.min(
      this.POINTS.COMMUNITY_CONTRIBUTIONS_MAX,
      parseInt(witnessResult.rows[0].witness_count) * 10
    );

    // Invitation outcomes
    const inviteQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE outcome = 'success') as successful,
        COUNT(*) FILTER (WHERE outcome = 'banned') as failed
      FROM invitation_outcomes
      WHERE inviter_id = $1
    `;
    const inviteResult = await db.query(inviteQuery, [userId]);

    return {
      connectionQuality,
      communityContributions,
      successfulInvites: parseInt(inviteResult.rows[0].successful) || 0,
      failedInvites: parseInt(inviteResult.rows[0].failed) || 0
    };
  }

  /**
   * Format factor name for display
   */
  static formatFactorName(name) {
    const names = {
      profileCompleteness: 'Profile Completeness',
      connectionQuality: 'Connection Quality',
      communityContributions: 'Community Contributions',
      verificationLevel: 'Verification Level',
      endorsements: 'Endorsements',
      successfulInvites: 'Successful Invites',
      failedInvites: 'Failed Invites'
    };
    return names[name] || name;
  }
}

module.exports = TrustScore;
