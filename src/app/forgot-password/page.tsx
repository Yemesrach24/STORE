import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound } from "lucide-react";

export default async function ForgotPasswordPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Help</h1>
          <p className="text-gray-600">Recovering access to your account</p>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <KeyRound className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">No Password Needed</CardTitle>
            <CardDescription className="text-center">
              This app uses Google sign-in, so there is no password to reset.
              If you can&apos;t get into your account, use Google&apos;s recovery tools
              or sign in with a different Google account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button asChild className="w-full">
              <a href="/sign-in">Back to Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
