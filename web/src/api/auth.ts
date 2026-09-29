import { apiFetch } from './client.ts';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const registerUser = (email: string, password: string, name: string) =>
  apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });

export const loginUser = (email: string, password: string) =>
  apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const fetchMe = () => apiFetch<User>('/auth/me');
