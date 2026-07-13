import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, teachers, adminProfiles, students } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, location, bio } = body;

    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, session.user.email)
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update core user profile fields
    await db
      .update(users)
      .set({
        phone: phone || null,
        location: location || null,
        bio: bio || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id));

    // Update name based on role
    if (name) {
      if (userRecord.role === "TEACHER") {
        await db.update(teachers).set({ name }).where(eq(teachers.userId, userRecord.id));
      } else if (["ADMIN", "OFFICE", "PRINCIPAL"].includes(userRecord.role)) {
        // Attempt to update admin profile if it exists
        const adminProfile = await db.query.adminProfiles.findFirst({
          where: eq(adminProfiles.userId, userRecord.id)
        });
        if (adminProfile) {
          await db.update(adminProfiles).set({ name }).where(eq(adminProfiles.userId, userRecord.id));
        } else {
           // Insert one if it didn't exist
           await db.insert(adminProfiles).values({
             userId: userRecord.id,
             name: name,
           });
        }
      }
      // Note: Students are more complex because their name is deeply tied to admissions/classes. 
      // We will skip updating student names directly here to prevent corrupting enrollment data.
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      with: {
        teacherProfile: true,
        adminProfile: true
      }
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine the actual name based on the role profile
    let resolvedName = session.user.name; // Fallback to session
    if (userRecord.role === "TEACHER" && userRecord.teacherProfile) {
      resolvedName = userRecord.teacherProfile.name;
    } else if (["ADMIN", "OFFICE", "PRINCIPAL"].includes(userRecord.role) && userRecord.adminProfile) {
      resolvedName = userRecord.adminProfile.name;
    }

    return NextResponse.json({ 
      profile: {
        profileId: userRecord.profileId,
        phone: userRecord.phone,
        bio: userRecord.bio,
        location: userRecord.location,
        profilePictureUrl: userRecord.profilePictureUrl,
        name: resolvedName,
      }
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
