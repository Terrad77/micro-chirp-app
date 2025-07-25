"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { z } from "zod"; // for schema validation
import { toFormikValidationSchema } from "zod-formik-adapter"; // for converting Zod schema to Formik validation schema
import { useFormik } from "formik";
import Link from "next/link";

// Type for form values (= backend Schema validation for registration and login in auth/index.ts)
const authSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(50, "Username must be at most 50 characters long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be at most 100 characters long"),
});

type AuthFormValues = z.infer<typeof authSchema>;

interface AuthFormProps {
  type: "register" | "login";
}

// Interface for backend error response
interface BackendErrorResponse {
  message: string;
  // if backend returns additional error details
  code?: string;
  details?: string[];
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // use useMutation for sending data to the backend
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: AuthFormValues) => {
      const endpoint =
        type === "register" ? "/api/auth/register" : "/api/auth/login";
      const response = await api.post(endpoint, values);
      return response.data;
    },
    onSuccess: (data) => {
      // successful response handling for login/register
      if (data.token) {
        localStorage.setItem("authToken", data.token); // Save token to localStorage
      }
      // redirect to home page
      router.push("/");
    },
    onError: (err: AxiosError<BackendErrorResponse>) => {
      setError(err.response?.data?.message || "An unexpected error occurred.");
    },
  });

  const formik = useFormik<AuthFormValues>({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: toFormikValidationSchema(authSchema),
    onSubmit: (values) => {
      setError(null); // Clear errors
      mutate(values);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {type === "register" ? "Register" : "Login"}
        </h2>
        <form onSubmit={formik.handleSubmit}>
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Username:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
            />
            {formik.touched.username && formik.errors.username ? (
              <p className="text-red-500 text-xs italic">
                {formik.errors.username}
              </p>
            ) : null}
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
            />
            {formik.touched.password && formik.errors.password ? (
              <p className="text-red-500 text-xs italic">
                {formik.errors.password}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              disabled={isPending}
            >
              {isPending
                ? "Processing..."
                : type === "register"
                ? "Register"
                : "Login"}
            </button>
            {type === "login" ? (
              <Link
                href="/register"
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Don't have an account? Register!
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Already have an account? Login!
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
