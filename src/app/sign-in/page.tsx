import { auth } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Link from "next/link";


export default async function SignInPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="TKD Store" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">TKD Store</h1>
          <p className="text-gray-500 text-sm mt-1">
            {userId
              ? "You are already signed in. Sign in with a different account below."
              : "Sign in to shop taekwondo equipment"}
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {userId ? (
            <div className="space-y-4">
              <GoogleSignInButton callbackUrl="/shop" label="Switch Account" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">or</span>
                </div>
              </div>
              <Link href="/shop">
                <button className="w-full h-10 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  Go to Shop
                </button>
              </Link>
            </div>
          ) : (
            <GoogleSignInButton />
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              By signing in, you agree to our terms of service.
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
         <Link href="/shop">Back to Shop</Link>
        </p>
      </div>
    </div>
  );
}
