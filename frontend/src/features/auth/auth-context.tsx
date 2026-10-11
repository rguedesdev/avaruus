"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { graphQLRequest } from "@/shared/lib/graphql/client";
import { clearAuthToken, readAuthToken, storeAuthToken } from "./auth-storage";
import type {
  AuthPayload,
  AuthUser,
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
} from "./auth.types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn(data: SignInInput, remember?: boolean): Promise<AuthUser>;
  signUp(data: SignUpInput): Promise<AuthUser>;
  updateProfile(data: UpdateProfileInput): Promise<AuthUser>;
  refreshUser(): Promise<AuthUser>;
  signOut(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const authUserSelection = `
  id
  accountType
  name
  username
  email
  avatarUrl
  cpfMasked
  createdAt
  defaultAddress {
    id label recipientName postalCode street number complement neighborhood city state isDefault
  }
`;

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      await Promise.resolve();
      const token = readAuthToken();
      if (!token) {
        if (active) setStatus("unauthenticated");
        return;
      }

      try {
        const data = await graphQLRequest<{ me: AuthUser }, Record<string, never>>(
          `query RestoreSession { me { ${authUserSelection} } }`,
          {},
          token,
        );
        if (!active) return;
        setUser(data.me);
        setStatus("authenticated");
      } catch {
        clearAuthToken();
        if (!active) return;
        setUser(null);
        setStatus("unauthenticated");
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  async function signIn(input: SignInInput, remember = true) {
    const data = await graphQLRequest<{ signIn: AuthPayload }, { data: SignInInput }>(
      `mutation SignIn($data: SignInInput!) {
        signIn(data: $data) { token user { ${authUserSelection} } }
      }`,
      { data: input },
    );
    storeAuthToken(data.signIn.token, remember);
    setUser(data.signIn.user);
    setStatus("authenticated");
    return data.signIn.user;
  }

  async function signUp(input: SignUpInput) {
    const data = await graphQLRequest<{ signUp: AuthPayload }, { data: SignUpInput }>(
      `mutation SignUp($data: SignUpInput!) {
        signUp(data: $data) { token user { ${authUserSelection} } }
      }`,
      { data: input },
    );
    storeAuthToken(data.signUp.token, true);
    setUser(data.signUp.user);
    setStatus("authenticated");
    return data.signUp.user;
  }

  async function updateProfile(input: UpdateProfileInput) {
    const token = readAuthToken();
    if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
    const data = await graphQLRequest<
      { updateProfile: AuthUser },
      { data: UpdateProfileInput }
    >(
      `mutation UpdateProfile($data: UpdateProfileInput!) {
        updateProfile(data: $data) { ${authUserSelection} }
      }`,
      { data: input },
      token,
    );
    setUser(data.updateProfile);
    return data.updateProfile;
  }

  async function refreshUser() {
    const token = readAuthToken();
    if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
    const data = await graphQLRequest<{ me: AuthUser }, Record<string, never>>(
      `query RefreshUser { me { ${authUserSelection} } }`,
      {},
      token,
    );
    setUser(data.me);
    return data.me;
  }

  function signOut() {
    clearAuthToken();
    setUser(null);
    setStatus("unauthenticated");
  }

  const value = useMemo(
    () => ({ status, user, signIn, signUp, updateProfile, refreshUser, signOut }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}

export { AuthProvider, useAuth };
