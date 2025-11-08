// app/(public)/auth/register/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    try {
      // Register person
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      // Auto-login after registration
      await login({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className='max-w-md mx-auto mt-24 p-8 bg-white rounded-lg shadow-lg'>
      <h1 className='text-3xl font-bold text-center text-gray-800 mb-8'>
        Create Account
      </h1>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='text'
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder='First Name'
          required
          className='px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        />

        <input
          type='text'
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder='Last Name'
          required
          className='px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        />

        <input
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='Email'
          required
          className='px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        />

        <input
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder='Password (min 8 characters)'
          required
          minLength={8}
          className='px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        />

        <input
          type='password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder='Confirm Password'
          required
          className='px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        />

        <Button type='submit' disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Register"}
        </Button>

        {(localError || error) && (
          <p className='text-red-600 text-sm'>{localError || error}</p>
        )}
      </form>

      <Link
        href='/public/auth/login'
        className='block text-center text-blue-600 mt-6 hover:underline'
      >
        Already have an account? Login
      </Link>
    </div>
  );
}
