"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import useAuthStore from "@/stores/authStore";

import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login failed");
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md rounded-2xl bg-white p-8 shadow-lg'>
        <h2 className='mb-6 text-center text-2xl font-bold text-gray-900'>
          Welcome Back
        </h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <input
            type='email'
            placeholder='Email'
            className='w-full rounded-lg border p-3'
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type='password'
            placeholder='Password'
            className='w-full rounded-lg border p-3'
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type='submit' disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          {error && <p className='text-red-600 text-sm'>{error}</p>}
        </form>
        <Link
          href='/public/auth/register'
          className='block text-center text-blue-600 mt-6 hover:underline'
        >
          Don't have an account? Register
        </Link>
      </div>
    </div>
  );
}
