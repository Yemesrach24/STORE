'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Calendar } from 'lucide-react';
import * as z from 'zod';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
});

type ProfileInput = z.infer<typeof profileSchema>;

interface DbUser {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  role: string;
  createdAt: string;
}

export default function UserProfile() {
  const { data: session } = useSession();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    fetch('/api/users/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) setDbUser(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: dbUser?.firstName || session?.user?.name?.split(' ')[0] || '',
      lastName: dbUser?.lastName || session?.user?.name?.split(' ').slice(1).join(' ') || '',
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    if (!session?.user) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to update profile');
      }

      setDbUser((prev) => prev ? { ...prev, ...data, name: `${data.firstName} ${data.lastName}` } : prev);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const user = dbUser;
  const fullName = user?.name || session.user.name || 'User';
  const email = user?.email || session.user.email || '';
  const imageUrl = user?.imageUrl || session.user.image;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={fullName}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{fullName}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {user?.role || 'User'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 


export { UserProfile };
