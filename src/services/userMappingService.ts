import { firebaseAuthService } from './firebaseAuthService';

/**
 * Service to handle mapping between Supabase user IDs and Firebase user IDs
 * This ensures chat functionality works correctly with our dual authentication system
 */
class UserMappingService {
  private userIdMap = new Map<string, string>(); // supabaseId -> firebaseId
  private reverseMap = new Map<string, string>(); // firebaseId -> supabaseId

  /**
   * Get Firebase user ID for a given Supabase user ID
   * Creates a Firebase anonymous user if needed
   */
  async getFirebaseUserId(supabaseUserId: string): Promise<string> {
    try {
      // Check if we already have a mapping
      if (this.userIdMap.has(supabaseUserId)) {
        const firebaseId = this.userIdMap.get(supabaseUserId)!;
        console.log(`Using cached Firebase ID: ${firebaseId} for Supabase ID: ${supabaseUserId}`);
        return firebaseId;
      }

      // Ensure Firebase authentication
      const firebaseUser = await firebaseAuthService.ensureAuthenticated();
      const firebaseUserId = firebaseUser.uid;

      // Create mapping
      this.userIdMap.set(supabaseUserId, firebaseUserId);
      this.reverseMap.set(firebaseUserId, supabaseUserId);

      console.log(`Created mapping: Supabase ${supabaseUserId} -> Firebase ${firebaseUserId}`);
      return firebaseUserId;
    } catch (error) {
      console.error('Error getting Firebase user ID:', error);
      throw error;
    }
  }

  /**
   * Get Supabase user ID for a given Firebase user ID
   */
  getSupabaseUserId(firebaseUserId: string): string | null {
    return this.reverseMap.get(firebaseUserId) || null;
  }

  /**
   * Clear all mappings (useful for logout)
   */
  clearMappings(): void {
    this.userIdMap.clear();
    this.reverseMap.clear();
    console.log('User ID mappings cleared');
  }

  /**
   * Create a deterministic Firebase-compatible user ID from Supabase ID
   * This ensures the same Supabase user always gets the same Firebase ID
   */
  createDeterministicFirebaseId(supabaseUserId: string): string {
    // Use a prefix to identify mapped users and ensure uniqueness
    return `mapped_${supabaseUserId.replace(/-/g, '_')}`;
  }

  /**
   * Check if a Firebase ID is a mapped ID
   */
  isMappedFirebaseId(firebaseUserId: string): boolean {
    return firebaseUserId.startsWith('mapped_');
  }

  /**
   * Extract Supabase ID from a mapped Firebase ID
   */
  extractSupabaseIdFromMapped(mappedFirebaseId: string): string | null {
    if (!this.isMappedFirebaseId(mappedFirebaseId)) {
      return null;
    }
    return mappedFirebaseId.replace('mapped_', '').replace(/_/g, '-');
  }
}

export const userMappingService = new UserMappingService();
export default userMappingService;
