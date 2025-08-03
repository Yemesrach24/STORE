import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SignUpForm from "@/components/auth/SignUpForm";

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
        <SignUpForm />
      </div>
    </div>
  );
} 