// adminService.ts
import crypto from 'crypto';
import { Admin } from './adminModel';
import { Invitation } from './adminModel';
import { Country } from '../Country/countryModel'; // Adjust path as needed
import { 
  IAdminRegistration, 
  IAdminLogin, 
  IAdminUpdate,
  ICreateInvitation,
  IAcceptInvitation,
  AdminLevel,
  AdminStatus,
  InvitationStatus,
  ADMIN_LEVEL_PERMISSIONS
} from '../types/adminTypes';
import { generateAccessAndRefreshToken } from '../utils/generateTokens'; // Adjust path as needed
import { sendInvitationEmail } from '../utils/generateInvitationEmails.js'; // You'll need to create this

export class AdminService {

  // Register new admin
  static async registerAdmin(adminData: IAdminRegistration) {
    const { firstName, lastName, email, password, phone, adminLevel, countryId } = adminData;

    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        throw new Error('Admin with this email already exists');
      }

      // Validate country for non-super admins
      if (adminLevel !== AdminLevel.SUPER_ADMIN) {
        if (!countryId) {
          throw new Error('Country is required for Main and Minor admins');
        }
        
        const country = await Country.findById(countryId);
        if (!country) {
          throw new Error('Invalid country selected');
        }
      }

      // Create new admin
      const admin = new Admin({
        firstName,
        lastName,
        email,
        password,
        phone,
        adminLevel,
        countryId: countryId || undefined,
        permissions: ADMIN_LEVEL_PERMISSIONS[adminLevel],
      });

      await admin.save();

      // Generate JWT token
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        admin._id.toString(),
        "admin"
      );

      return {
        message: 'Admin registered successfully',
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          adminLevel: admin.adminLevel,
          countryId: admin.countryId,
        },
        accessToken,
        refreshToken,
      };

    } catch (error) {
      throw error;
    }
  }
  
  
  // Create invitation for new admin
  static async createInvitation(invitationData: ICreateInvitation, createdBy: string) {
    const { email, adminLevel, countryId } = invitationData;

    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        throw new Error('Admin with this email already exists');
      }

      // Check if there's already a pending invitation
      const existingInvitation = await Invitation.findOne({ 
        email, 
        status: InvitationStatus.PENDING 
      });
      if (existingInvitation) {
        throw new Error('Invitation already sent to this email');
      }

      // Validate country for non-super admins
      if (adminLevel !== AdminLevel.SUPER_ADMIN) {
        if (!countryId) {
          throw new Error('Country is required for Main and Minor admins');
        }
        
        const country = await Country.findById(countryId);
        if (!country) {
          throw new Error('Invalid country selected');
        }
      }

      // Generate unique invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex');

      // Create invitation
      const invitation = new Invitation({
        email,
        adminLevel,
        countryId: countryId || undefined,
        invitationToken,
        invitedBy: createdBy,
      });

      await invitation.save();

      // Send invitation email
      await sendInvitationEmail(email, invitationToken, adminLevel);

      return {
        message: 'Invitation sent successfully',
        invitationId: invitation._id,
        email: invitation.email,
      };

    } catch (error) {
      throw error;
    }
  }

  // Accept invitation and create admin account
  static async acceptInvitation(acceptanceData: IAcceptInvitation) {
    const { token, firstName, lastName, password, phone } = acceptanceData;

    try {
      // Find and validate invitation
      const invitation = await Invitation.findValidByToken(token);
      if (!invitation) {
        throw new Error('Invalid or expired invitation token');
      }

      // Check if admin already exists (edge case)
      const existingAdmin = await Admin.findOne({ email: invitation.email });
      if (existingAdmin) {
        throw new Error('Admin account already exists for this email');
      }

      // Create admin account
      const admin = new Admin({
        firstName,
        lastName,
        email: invitation.email,
        password,
        phone,
        adminLevel: invitation.adminLevel,
        countryId: invitation.countryId,
        permissions: ADMIN_LEVEL_PERMISSIONS[invitation.adminLevel],
        createdBy: invitation.invitedBy,
        isEmailVerified: true, 
      });

      await admin.save();

      // Update invitation status
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.acceptedAt = new Date();
      await invitation.save();

      // Generate JWT token
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        admin._id.toString(),
        "admin"
      );

      return {
        message: 'Admin account created successfully',
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          adminLevel: admin.adminLevel,
          countryId: admin.countryId,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  // Admin login
  static async loginAdmin(loginData: IAdminLogin) {
    const { email, password } = loginData;

    try {
      // Find admin with password
      const admin = await Admin.findOne({ 
        email, 
        status: AdminStatus.ACTIVE 
      }).select('+password').populate('countryId');

      if (!admin) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate JWT token
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        admin._id.toString(),
        "admin"
      );

      return {
        message: 'Login successful',
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          adminLevel: admin.adminLevel,
          countryId: admin.countryId,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin,
        },
        accessToken,
        refreshToken,
      };

    } catch (error) {
      throw error;
    }
  }

  // Get all admins (Super Admin only)
  static async getAllAdmins(requestingAdminId: string, countryFilter?: string) {
    try {
      const requestingAdmin = await Admin.findById(requestingAdminId);
      if (!requestingAdmin) {
        throw new Error('Admin not found');
      }

      let query: any = {};

      // Super admin can see all admins
      if (requestingAdmin.adminLevel === AdminLevel.SUPER_ADMIN) {
        if (countryFilter) {
          query.countryId = countryFilter;
        }
      } else {
        // Other admins can only see admins in their country
        query.countryId = requestingAdmin.countryId;
      }

      const admins = await Admin.find(query)
        .populate('countryId', 'name')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return admins;

    } catch (error) {
      throw error;
    }
  }

  // Update admin
  static async updateAdmin(adminId: string, updateData: IAdminUpdate, requestingAdminId: string) {
    try {
      const requestingAdmin = await Admin.findById(requestingAdminId);
      if (!requestingAdmin) {
        throw new Error('Requesting admin not found');
      }

      const adminToUpdate = await Admin.findById(adminId);
      if (!adminToUpdate) {
        throw new Error('Admin not found');
      }

      // Only Super Admin can update other admins
      if (requestingAdmin.adminLevel !== AdminLevel.SUPER_ADMIN) {
        throw new Error('Insufficient permissions to update admin');
      }

      // Validate country if provided
      if (updateData.countryId) {
        const country = await Country.findById(updateData.countryId);
        if (!country) {
          throw new Error('Invalid country selected');
        }
      }

      // Update admin
      Object.assign(adminToUpdate, updateData);
      await adminToUpdate.save();

      return {
        message: 'Admin updated successfully',
        admin: adminToUpdate,
      };

    } catch (error) {
      throw error;
    }
  }

  // Get pending invitations
  static async getPendingInvitations(requestingAdminId: string) {
    try {
      const requestingAdmin = await Admin.findById(requestingAdminId);
      if (!requestingAdmin) {
        throw new Error('Admin not found');
      }

      // Only Super Admin can view invitations
      if (requestingAdmin.adminLevel !== AdminLevel.SUPER_ADMIN) {
        throw new Error('Insufficient permissions to view invitations');
      }

      const invitations = await Invitation.find({ 
        status: InvitationStatus.PENDING 
      })
        .populate('countryId', 'name')
        .populate('invitedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return invitations;

    } catch (error) {
      throw error;
    }
  }

  // Cancel invitation
  static async cancelInvitation(invitationId: string, requestingAdminId: string) {
    try {
      const requestingAdmin = await Admin.findById(requestingAdminId);
      if (!requestingAdmin) {
        throw new Error('Admin not found');
      }

      // Only Super Admin can cancel invitations
      if (requestingAdmin.adminLevel !== AdminLevel.SUPER_ADMIN) {
        throw new Error('Insufficient permissions to cancel invitation');
      }

      const invitation = await Invitation.findById(invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new Error('Can only cancel pending invitations');
      }

      invitation.status = InvitationStatus.CANCELLED;
      await invitation.save();

      return {
        message: 'Invitation cancelled successfully',
      };

    } catch (error) {
      throw error;
    }
  }

  // Resend invitation
  static async resendInvitation(invitationId: string, requestingAdminId: string) {
    try {
      const requestingAdmin = await Admin.findById(requestingAdminId);
      if (!requestingAdmin) {
        throw new Error('Admin not found');
      }

      // Only Super Admin can resend invitations
      if (requestingAdmin.adminLevel !== AdminLevel.SUPER_ADMIN) {
        throw new Error('Insufficient permissions to resend invitation');
      }

      const invitation = await Invitation.findById(invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new Error('Can only resend pending invitations');
      }

      // Generate new token and extend expiry
      const newToken = crypto.randomBytes(32).toString('hex');
      invitation.invitationToken = newToken;
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await invitation.save();

      // Send new invitation email
      await sendInvitationEmail(invitation.email, newToken, invitation.adminLevel);

      return {
        message: 'Invitation resent successfully',
      };

    } catch (error) {
      throw error;
    }
  }

  // Cleanup expired invitations (can be run as a cron job)
  static async cleanupExpiredInvitations() {
    try {
      const result = await Invitation.cleanupExpired();
      return {
        message: 'Expired invitations cleaned up',
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      throw error;
    }
  }
}