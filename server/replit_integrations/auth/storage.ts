import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// Note: All methods use replitId (the Clerk userId string) for lookups.
// The internal id (UUID) is auto-generated and used for foreign key references.
export interface IAuthStorage {
  getUser(replitId: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(replitId: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(replitId: string): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  // Get user by replitId (Clerk userId)
  async getUser(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user;
  }

  // Get user by internal UUID id
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Upsert by replitId (Clerk userId) — if user exists, update; otherwise create with new UUID id
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.replitId,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(replitId: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.replitId, replitId))
      .returning();
    return user;
  }

  async deleteUser(replitId: string): Promise<void> {
    await db.delete(users).where(eq(users.replitId, replitId));
  }
}

export const authStorage = new AuthStorage();
