const BASE_URL = "http://127.0.0.1:8000/api";

// ===== TIPE =====
export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  username: string;
  email: string;
  role: string;
  password: string;
  password_confirmation: string;
};

export type AuthUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  token_type: string;
  user: AuthUser;
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

// ===== HELPER =====
function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function publicHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ===== AUTH =====
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Username atau password salah.");
  }

  return data;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const messages = data.errors
      ? (Object.values(data.errors) as string[][]).flat().join(" ")
      : data.message || "Terjadi kesalahan.";
    throw new Error(messages);
  }

  return data;
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: authHeaders(),
  });
  localStorage.clear();
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: authHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Gagal mengambil data user.");
  }

  return data;
}