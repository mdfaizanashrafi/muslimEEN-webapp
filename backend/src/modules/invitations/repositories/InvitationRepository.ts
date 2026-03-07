/**
 * Invitation Repository
 */

import pool from '../../database/pool';

export const validateByCode = async (code: string): Promise<any> => {
  const result = await pool.query(
    `SELECT i.*, u.email as inviter_email
     FROM invitations i
     JOIN users u ON i.created_by = u.id
     WHERE i.code = $1 AND i.status = 'pending'
     AND (i.expires_at IS NULL OR i.expires_at > NOW())`,
    [code]
  );
  
  if (result.rows.length === 0) {
    return { valid: false, message: 'Invalid or expired invitation code' };
  }

  const invitation = result.rows[0];
  
  if (invitation.used_count >= invitation.max_uses) {
    return { valid: false, message: 'Invitation code has been fully used' };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      code: invitation.code,
      inviteeEmail: invitation.invitee_email,
      createdBy: invitation.created_by,
      maxUses: invitation.max_uses,
      usedCount: invitation.used_count,
    },
  };
};

export const markAsUsed = async (code: string, userId: string): Promise<any> => {
  const result = await pool.query(
    `UPDATE invitations 
     SET used_count = used_count + 1,
         status = CASE WHEN used_count + 1 >= max_uses THEN 'used' ELSE 'pending' END,
         updated_at = NOW()
     WHERE code = $1
     RETURNING *`,
    [code]
  );
  return result.rows[0];
};

export const create = async (inviterId: string, inviteeEmail: string): Promise<any> => {
  const code = generateInvitationCode();
  const result = await pool.query(
    `INSERT INTO invitations (code, invitee_email, created_by, status, max_uses, used_count, expires_at)
     VALUES ($1, $2, $3, 'pending', 1, 0, NOW() + INTERVAL '30 days')
     RETURNING *`,
    [code, inviteeEmail, inviterId]
  );
  return mapToInvitation(result.rows[0]);
};

export const getByInviter = async (inviterId: string, status?: string | null): Promise<any[]> => {
  let query = 'SELECT * FROM invitations WHERE created_by = $1';
  const params: any[] = [inviterId];
  
  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const result = await pool.query(query, params);
  return result.rows.map(mapToInvitation);
};

export const countPendingByInviter = async (inviterId: string): Promise<number> => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM invitations WHERE created_by = $1 AND status = \'pending\'',
    [inviterId]
  );
  return parseInt(result.rows[0].count, 10);
};

export const revoke = async (invitationId: string, inviterId: string): Promise<any> => {
  const result = await pool.query(
    `UPDATE invitations 
     SET status = 'revoked', updated_at = NOW()
     WHERE id = $1 AND created_by = $2 AND status = 'pending'
     RETURNING *`,
    [invitationId, inviterId]
  );
  return result.rows[0] ? mapToInvitation(result.rows[0]) : null;
};

export const cleanupExpired = async (): Promise<number> => {
  const result = await pool.query(
    `UPDATE invitations 
     SET status = 'expired', updated_at = NOW()
     WHERE status = 'pending' AND expires_at < NOW()`
  );
  return result.rowCount || 0;
};

// ============================================================================
// HELPERS
// ============================================================================

const generateInvitationCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.substring(0, 4) + '-' + code.substring(4, 8);
};

const mapToInvitation = (row: any): any => ({
  id: row.id,
  code: row.code,
  inviteeEmail: row.invitee_email,
  createdBy: row.created_by,
  status: row.status,
  maxUses: row.max_uses,
  usedCount: row.used_count,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
});
