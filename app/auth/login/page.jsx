"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import Button from "../../../components/ui/Button";
import AuthLoginButton from "./AuthLoginButton";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md rounded-2xl bg-white p-8 shadow-lg'>
        <h2 className='mb-6 text-center text-2xl font-bold text-gray-900'>
          Welcome Back
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login(email, password);
          }}
          className='space-y-4'
        >
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
          <AuthLoginButton />
        </form>
      </div>
    </div>
  );
}
