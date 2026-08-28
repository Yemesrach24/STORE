"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, Mail, Shield } from "lucide-react";

interface User {
  _id: string;
  authId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";
  isActive: boolean;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function UserFormModal({ open, onOpenChange, user, onSuccess }: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | "CUSTOMER">("CUSTOMER");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setRole(user.role);
      setIsActive(user.isActive);
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("CUSTOMER");
      setIsActive(true);
    }
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = user ? `/api/admin/users/${user._id}` : "/api/admin/users";
      const method = user ? "PUT" : "POST";
      const payload = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        role,
        isActive,
      };
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save user");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {user ? "Edit User" : "Create User"}
          </DialogTitle>
          <DialogDescription>
            {user ? "Update user information and permissions." : "Create a new user account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Role
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as "SUPER_ADMIN" | "ADMIN" | "CUSTOMER")}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Account Status</Label>
              <p className="text-sm text-muted-foreground">{isActive ? "Active" : "Disabled"}</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : user ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
