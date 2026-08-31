import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.authId = user.id as string;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      // Persist role in the token so it survives across navigations and
      // refreshes (fixes dashboard link disappearing until re-login).
      if (token.authId && (trigger === 'signIn' || trigger === 'update' || !token.role)) {
        try {
          await dbConnect();
          const dbUser: any = await User.findOne({ authId: token.authId }).select('role isActive').lean();
          token.role = dbUser?.isActive === false ? null : (dbUser?.role || 'CUSTOMER');
        } catch (err) {
          console.error('jwt: failed to load role', err);
        }
      }
      return token;
    },
    async signIn({ user }) {
      const authId = user.id;
      if (!authId) return false;

      try {
        await dbConnect();

        let dbUser = await User.findOne({ authId });

        if (dbUser) {
          // Refresh profile data from the provider
          dbUser.name = user.name ?? dbUser.name;
          dbUser.email = user.email ?? dbUser.email;
          dbUser.imageUrl = user.image ?? dbUser.imageUrl;
          dbUser.lastLoginAt = new Date();
          await dbUser.save();
        } else if (user.email) {
          // Check if a user with this email already exists (e.g. different authId from earlier session)
          const emailUser = await User.findOne({ email: user.email });
          if (emailUser) {
            // Link this Google authId to the existing user
            emailUser.authId = authId;
            emailUser.name = user.name ?? emailUser.name;
            emailUser.imageUrl = user.image ?? emailUser.imageUrl;
            emailUser.lastLoginAt = new Date();
            await emailUser.save();
            dbUser = emailUser;
            console.log(`Linked existing user ${emailUser.email} to Google authId ${authId}`);
          }
        }

        if (!dbUser) {
          // New user: determine role
          // Check if there's already a real SUPER_ADMIN (non-placeholder)
          const hasRealSuperAdmin = await User.findOne({
            role: 'SUPER_ADMIN',
            email: { $not: /@placeholder\.com$/i, $ne: '' }
          });

          let role: string;
          if (!hasRealSuperAdmin) {
            // No real SUPER_ADMIN exists — first real Google user becomes SUPER_ADMIN
            role = 'SUPER_ADMIN';
            // Deactivate any placeholder users
            await User.updateMany(
              { email: /@placeholder\.com$/i },
              { $set: { isActive: false } }
            );
            console.log('First real user — promoted to SUPER_ADMIN, deactivated placeholder users');
          } else {
            role = 'CUSTOMER';
          }

          const realName = user.name || 'User';
          const nameParts = realName.trim().split(/\s+/);
          dbUser = await User.create({
            authId,
            name: realName,
            email: user.email || `${authId}@google.com`,
            firstName: nameParts[0] || 'User',
            lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0],
            imageUrl: user.image,
            role,
            isActive: true,
            lastLoginAt: new Date(),
            theme: "system",
            language: "en",
            currency: "ETB",
            timezone: "UTC",
          });

          console.log(`New user created: ${dbUser.email} with role: ${role}`);
        }

        return true;
      } catch (error) {
        console.error("Error syncing user from Google sign-in:", error);
        return true;
      }
    },
    async session({ session, token }) {
      if (token.authId) {
        (session.user as any).id = token.authId as string;
        (session.user as any).role = token.role ?? null;
        (session.user as any).name = token.name ?? "";
        (session.user as any).email = token.email ?? "";
        (session.user as any).image = token.picture ?? null;

        // Fetch dbUserId from MongoDB (role is already persisted in the token)
        try {
          await dbConnect();
          const dbUser: any = await User.findOne({ authId: token.authId }).select('_id role isActive name email imageUrl').lean();
          if (dbUser) {
            (session.user as any).dbUserId = dbUser._id?.toString();
            (session.user as any).role = dbUser.isActive === false ? null : (dbUser.role ?? (session.user as any).role ?? null);
            (session.user as any).name = dbUser.name || (session.user as any).name || "";
            (session.user as any).email = dbUser.email || (session.user as any).email || "";
            (session.user as any).image = dbUser.imageUrl || (session.user as any).image || null;
          }
        } catch {
          // keep token-provided values
        }
      }
      return session;
    },
  },
});
