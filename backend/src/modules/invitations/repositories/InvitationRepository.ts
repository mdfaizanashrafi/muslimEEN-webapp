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

export const markAsUsed = async (code: string, userId: string): Promise<void> => {
  await pool.query(
    `UPDATE invitations 
     SET used_count = used_count + 1,
         status = CASE WHEN used_count + 1 >= max_uses THEN 'used' ELSE 'pending' END
     WHERE code = $1`,
    [code]
  );
};
