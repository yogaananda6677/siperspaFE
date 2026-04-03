const BASE_URL = "http://127.0.0.1:8000/api";

// ===== TIPE =====
export type LoginPayload = {
  email: string;
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

export type TipePs = {
  id_tipe: number;       // ✅ konsisten pakai id_tipe
  nama_tipe: string;
  harga_sewa: number;
  playstation_count?: number;
};

export type Playstation = {
  id_ps: number;
  id_tipe: number;
  nomor_ps: string;
  status_ps: "tersedia" | "digunakan" | "maintenance";
  tipe?: TipePs;
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

/**
 * Baca body SEKALI, cek status, lempar error jika gagal.
 * Semua fungsi API wajib pakai ini — tidak boleh ada res.json() ganda.
 */
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json(); // ← satu-satunya tempat baca body

  if (!res.ok) {
    const message = data.errors
      ? (Object.values(data.errors) as string[][]).flat().join(" ")
      : data.message || `Error ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ===== AUTH =====
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<LoginResponse>(res);
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: publicHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<RegisterResponse>(res);
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: authHeaders(),
  });
  localStorage.clear();
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/me`, { headers: authHeaders() });
  // Laravel /me return { data: user } — unwrap di sini
  const result = await handleResponse<{ data: AuthUser }>(res);
  return result.data;
}

// ===== TIPE PS =====
export async function getTipePs(): Promise<TipePs[]> {
  const res = await fetch(`${BASE_URL}/tipe-ps`, { headers: authHeaders() });
  const result = await handleResponse<{ data: TipePs[] }>(res);
  return result.data;
}

export async function createTipePs(
  payload: Pick<TipePs, "nama_tipe" | "harga_sewa">  // ✅ Pick lebih aman dari Omit
): Promise<TipePs> {
  const res = await fetch(`${BASE_URL}/tipe-ps`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<{ data: TipePs }>(res);
  return result.data;
}

export async function updateTipePs(
  id: number,
  payload: Partial<Pick<TipePs, "nama_tipe" | "harga_sewa">>  // ✅ tidak ada id_tipe di payload
): Promise<TipePs> {
  const res = await fetch(`${BASE_URL}/tipe-ps/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<{ data: TipePs }>(res);
  return result.data;
}

export async function deleteTipePs(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/tipe-ps/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleResponse<{ message: string }>(res);
}


// ===== PLAYSTATION API =====
export async function getPlaystation(status?: string): Promise<Playstation[]> {
  const url = status
    ? `${BASE_URL}/playstation?status=${status}`
    : `${BASE_URL}/playstation`;
  const res = await fetch(url, { headers: authHeaders() });
  const result = await handleResponse<{ data: Playstation[] }>(res);
  return result.data;
}

export async function createPlaystation(
  payload: Pick<Playstation, "id_tipe" | "nomor_ps"> & { status_ps?: string }
): Promise<Playstation> {
  const res = await fetch(`${BASE_URL}/playstation`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<{ data: Playstation }>(res);
  return result.data;
}

export async function updatePlaystation(
  id: number,
  payload: Partial<Pick<Playstation, "id_tipe" | "nomor_ps" | "status_ps">>
): Promise<Playstation> {
  const res = await fetch(`${BASE_URL}/playstation/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<{ data: Playstation }>(res);
  return result.data;
}

export async function deletePlaystation(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/playstation/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleResponse<{ message: string }>(res);
}

export async function updateStatusPlaystation(
  id: number,
  status_ps: string
): Promise<Playstation> {
  const res = await fetch(`${BASE_URL}/playstation/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status_ps }),
  });
  const result = await handleResponse<{ data: Playstation }>(res);
  return result.data;
}