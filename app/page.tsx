"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { useToast } from "@/hooks/use-toast";

const INTERESTS = [
  "Music", "Dance", "Food", "Travel", "Sports",
  "Gaming", "Reading", "Movies", "Technology"
];

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleInterestChange = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = Object.fromEntries(formData);

    if (!isLogin) {
      data.interests = selectedInterests;
      if (selectedInterests.length < 3) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select at least 3 interests",
        });
        return;
      }
    }

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (isLogin) {
        localStorage.setItem("token", result.token);
        router.push("/explore"); 
      } else {
        toast({
          title: "Registration successful",
          description: "Please login to continue",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center">
          {isLogin ? "Welcome Back!" : "Join KIET Social"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <Input name="name" placeholder="Full Name" required />
              <Input name="username" placeholder="Choose Username" required />
              <Input name="gender" placeholder="enter gender" required />
              <Input name="year" type="number" min="1" max="4" placeholder="Year of Study" required />
              <Input name="branch" placeholder="Branch" required />
              <textarea name="bio" placeholder="Write a short bio..." className="w-full p-2 border rounded" required />

              <p className="text-sm font-medium">Select at least 3 Interests</p>
              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={selectedInterests.includes(interest)}
                      onCheckedChange={() => handleInterestChange(interest)}
                    />
                    <label htmlFor={interest} className="text-sm">{interest}</label>
                  </div>
                ))}
              </div>
            </>
          )}

          <Input name="email" type="email" placeholder="KIET Email" pattern=".+@kiet\.edu" required />
          <Input name="password" type="password" placeholder="Password" required />

          <Button type="submit" className="w-full">
            {isLogin ? "Login" : "Register"}
          </Button>
        </form>

        <p className="text-center text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline">
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </Card>
    </div>
  );
}
