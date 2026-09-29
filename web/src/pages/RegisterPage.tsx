import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth.ts';
import { ApiError } from '../api/client.ts';
import { useAuth } from '../auth/AuthContext.tsx';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => registerUser(email, password, name),
    onSuccess: ({ token, user }) => {
      login(token, user);
      navigate('/', { replace: true });
    },
  });

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Sign up</h1>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof ApiError ? mutation.error.message : 'Something went wrong.'}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-neutral-900 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Signing up…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-neutral-900 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
