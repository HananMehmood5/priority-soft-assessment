import { Injectable } from '@nestjs/common';
import { UserRole } from '@shiftsync/shared';
import { User } from '../database/models';
import { LocationRepository } from '../database/repositories/location.repository';

/**
 * Centralized permission checks to avoid duplicating "can manage location" and
 * "manager location IDs" logic across ShiftsService, RequestsService, AuditService.
 */
@Injectable()
export class PermissionsService {
  constructor(private readonly locationRepository: LocationRepository) {}

  /**
   * Returns location IDs the user can manage. Admin: null (all). Manager: assigned IDs. Others: [].
   */
  async getManagerLocationIds(user: User): Promise<string[] | null> {
    if (user.role === UserRole.Admin) return null;
    if (user.role !== UserRole.Manager) return [];
    return this.locationRepository.getManagerLocationIdsByUserId(user.id);
  }

  /**
   * True if the user can manage the given location (Admin or Manager assigned to that location).
   */
  async canManageLocation(user: User, locationId: string): Promise<boolean> {
    if (user.role === UserRole.Admin) return true;
    if (user.role !== UserRole.Manager) return false;
    const link = await this.locationRepository.findManagerLocation(user.id, locationId);
    return !!link;
  }

  /**
   * Locations a user may read schedule/request marketplace data for.
   * Admin: null (all). Manager: managed locations. Staff: certified locations.
   */
  async getLocationScopeForRead(user: User): Promise<string[] | null> {
    if (user.role === UserRole.Admin) return null;
    if (user.role === UserRole.Manager) {
      return this.locationRepository.getManagerLocationIdsByUserId(user.id);
    }
    return this.locationRepository.getStaffLocationIdsByUserId(user.id);
  }
}
