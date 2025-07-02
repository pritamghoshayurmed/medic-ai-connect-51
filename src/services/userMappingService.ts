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
  getFirebaseUserId(supabaseUserId: string): string {
    // Use a deterministic approach. No async needed.
    // No need to call firebaseAuthService.ensureAuthenticated() here,
    // as we are mapping an ID, not performing an auth-dependent action for the *current* user.

    if (!supabaseUserId) {
      throw new Error("Supabase User ID cannot be empty or null for mapping.");
    }

    // Check cache first
    if (this.userIdMap.has(supabaseUserId)) {
      return this.userIdMap.get(supabaseUserId)!;
    }

    const deterministicFirebaseId = this.createDeterministicFirebaseId(supabaseUserId);

    // Store in cache
    this.userIdMap.set(supabaseUserId, deterministicFirebaseId);
    this.reverseMap.set(deterministicFirebaseId, supabaseUserId);

    console.log(`Mapped Supabase ID ${supabaseUserId} to Firebase ID ${deterministicFirebaseId}`);
    return deterministicFirebaseId;
  }

  /**
   * Get Supabase user ID for a given Firebase user ID (which should be a deterministic one)
   */
  getSupabaseUserId(deterministicFirebaseId: string): string | null {
    if (!deterministicFirebaseId) return null;

    // Check cache first
    if (this.reverseMap.has(deterministicFirebaseId)) {
      return this.reverseMap.get(deterministicFirebaseId)!;
    }

    // If not in cache, try to derive it (e.g. if cache was cleared or this is a new session)
    const supabaseId = this.extractSupabaseIdFromMapped(deterministicFirebaseId);
    if (supabaseId) {
      // Populate cache
      this.userIdMap.set(supabaseId, deterministicFirebaseId);
      this.reverseMap.set(deterministicFirebaseId, supabaseId);
    }
    return supabaseId;
  }

  /**
   * Clear all mappings (useful for logout or context changes)
   */
  clearMappings(): void {
    this.userIdMap.clear();
    this.reverseMap.clear();
    console.log('User ID mappings cleared');
  }

  /**
   * Create a deterministic Firebase-compatible user ID from Supabase ID.
   * Firebase UIDs can be any non-empty string, up to 128 characters.
   * Using a prefix helps identify these as mapped UIDs.
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
