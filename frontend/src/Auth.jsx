import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else if (isSignUp) {
      setMessage("✅ Account created! Please check your email to verify.");
    } else {
      onLogin(data.user);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-indigo-600 mb-2 text-center">🧾 InvoiceIQ</h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          {isSignUp ? "Create your free account" : "Welcome back!"}
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {message && (
          <p className="text-sm text-center text-indigo-500 mb-3">{message}</p>
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition text-sm disabled:opacity-50"
        >
          {loading ? "Please wait..." : isSignUp ? "Create Account" : "Login"}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-500 font-medium ml-1 hover:underline"
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>

      </div>
    </div>
  );
}