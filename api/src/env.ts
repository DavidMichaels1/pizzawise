function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  pizzeriaApiBaseUrl: required('PIZZERIA_API_BASE_URL'),
  pizzeriaApiKey: required('PIZZERIA_API_KEY'),
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
};
