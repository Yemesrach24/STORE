import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Us</h1>
          <p className="text-gray-600">Create your inventory management account</p>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Your Google account is all you need — no separate password required
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleSignInButton label="Sign up with Google" />
            <Separator />
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <a href="/sign-in" className="text-blue-600 hover:text-blue-500 hover:underline">
                Sign in
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
