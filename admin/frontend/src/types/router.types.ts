export interface AuthContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RouterContext {
  auth: AuthContext;
}
