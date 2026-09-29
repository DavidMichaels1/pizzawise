import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.tsx';
import { PizzaBackground } from './PizzaBackground.tsx';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-neutral-50">
      <PizzaBackground />
      <header className="border-b border-neutral-200 bg-white">
        <nav className="flex items-center justify-between px-6 py-3">
          <Link to="/" className="text-lg font-semibold text-neutral-900">
            PizzaWise
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {user && (
              <>
                <Link to="/favorites" className="text-neutral-600 hover:text-neutral-900">
                  Favorites
                </Link>
                <Link to="/orders" className="text-neutral-600 hover:text-neutral-900">
                  Orders
                </Link>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-600">Hi, {user.name}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  Log out
                </button>
              </>
            )}
            {!user && (
              <>
                {pathname !== '/login' && (
                  <Link to="/login" className="text-neutral-600 hover:text-neutral-900">
                    Log in
                  </Link>
                )}
                {pathname !== '/register' && (
                  <Link
                    to="/register"
                    className="rounded-full bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
                  >
                    Sign up
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
