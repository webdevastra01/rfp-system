"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Permission cache interface
interface UserPermissions {
  permitted_pages: string[];
  permitted_sections: string[];
  permitted_subsections: string[];
  permitted_actions: string[];
}

export default function Authentication() {
  const supabase = createClient();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1️⃣ Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("Login error:", error.message);
        toast.error("Login failed", {
          description: error.message || "Invalid email or password.",
        });
        return;
      }

      const uuid = data.user?.id;

      if (!uuid) {
        console.log("User UUID not found");
        toast.error("Login failed", {
          description: "User identification failed. Please try again.",
        });
        return;
      }

      // 2️⃣ Fetch internal user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_id, first_name, middle_name, last_name")
        .eq("auth_user_id", uuid)
        .single();

      if (userError || !userData) {
        console.log("Internal user record not found:", userError?.message);
        toast.error("Login failed", {
          description: "User record not found. Please contact support.",
        });
        return;
      }

      // 3️⃣ Fetch user permissions
      const { data: permissionsData, error: permError } = await supabase
        .from("user_permissions")
        .select(
          "permitted_pages, permitted_sections, permitted_subsections, permitted_actions",
        )
        .eq("user_id", userData.user_id)
        .single();

      // Build permissions object (empty arrays if no permissions found)
      const userPermissions: UserPermissions = {
        permitted_pages: permissionsData?.permitted_pages || [],
        permitted_sections: permissionsData?.permitted_sections || [],
        permitted_subsections: permissionsData?.permitted_subsections || [],
        permitted_actions: permissionsData?.permitted_actions || [],
      };

      console.log(
        "Fetched permissions:",
        JSON.stringify(userPermissions, null, 2),
      );

      if (permError && permError.code !== "PGRST116") {
        console.warn("Permissions fetch warning:", permError.message);
      }

      // 4️⃣ Store in Supabase session metadata (for server components)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          user_id: userData.user_id,
          full_name: `${userData.first_name} ${userData.last_name}`,
        },
      });

      if (updateError) {
        console.log("Error updating user metadata:", updateError.message);
      }

      // 5️⃣ Cache locally for client components
      const cacheData = {
        profile: userData,
        permissions: userPermissions,
      };

     // if (rememberMe) {
        localStorage.setItem("userCache", JSON.stringify(cacheData));
        console.log("User data cached in localStorage", cacheData);
      // } else {
      //   sessionStorage.setItem("userCache", JSON.stringify(cacheData));
      // }

      // 6️⃣ Show success toast and redirect
      toast.success("Welcome back!", {
        description: `Signed in as ${userData.first_name} ${userData.last_name}.`,
      });

      // 7️⃣ Redirect
      router.push("/home");
      router.refresh();
    } catch (err: any) {
      console.log("Unexpected login error:", err.message);
      toast.error("Login failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#1b2365] via-[#3a42a5] to-[#1b2365] px-6">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-105 w-105 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-105 w-105 rounded-full bg-blue-400/20 blur-3xl" />

      <Card className="w-95 border-0 bg-white shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-6 pb-6">
          <div className="flex justify-center mt-4">
            <Image
              src="/astra_logo.png"
              alt="Astra Business Solutions Logo"
              width={110}
              height={110}
              priority
            />
          </div>

          <div className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-[#2B3A9F]">
              Welcome Back
            </CardTitle>
            <p className="text-sm text-slate-500">
              Sign in to access the Astra Portal
            </p>
          </div>
        </CardHeader>

        {/* FORM */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                Email Address
              </Label>

              <Input
                id="email"
                type="email"
                required
                placeholder="name@company.com"
                autoComplete="username"
                className="h-11 bg-slate-50/70"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Lock className="h-4 w-4 text-slate-400" />
                Password
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pr-10 bg-slate-50/70"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* REMEMBER */}
            {/* <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
                className="data-checked:bg-[#2B3A9F]"
              />

              <Label
                htmlFor="remember"
                className="text-sm font-normal text-slate-600 cursor-pointer"
              >
                Remember me for 30 days
              </Label>
            </div> */}

            {/* BUTTON */}
            <Button
              type="submit"
              disabled={isLoading}
              className="group h-11 w-full bg-[#2B3A9F] font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-800"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
