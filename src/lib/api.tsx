
const BASE_URL = "http://192.168.40.147:8000/api";

// ===== AUTH =====
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
  id_user: number;
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

// ===== TIPE PS =====
export type TipePs = {
  id_tipe: number;
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

// ===== PRODUK =====
export type Produk = {
  id_produk: number;
  nama: string;
  jenis: string;
  harga: number;
  stock: number;
  created_at?: string;
  updated_at?: string;
};

export type CreateProdukPayload = Pick<Produk, "nama" | "jenis" | "harga" | "stock">;

export type UpdateProdukPayload = Partial<
  Pick<Produk, "nama" | "jenis" | "harga" | "stock">
>;

export type UpdateStockPayload = {
  aksi: "tambah" | "kurangi";
  jumlah: number;
};

export type UpdateStockResponse = {
  message: string;
  stock_saat_ini: number;
};

// ===== ADMIN =====
export type Admin = {
  id_user: number;
  name: string;
  username: string;
  email: string;
  created_at: string;
};

export type GetAdminsResponse = {
  data: Admin[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type CreateAdminPayload = {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type UpdateAdminPayload = {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
};

// ===== PELANGGAN =====
export type Pelanggan = {
  id_user: number;
  name: string;
  username: string;
  email: string;
  created_at: string;
};

export type GetPelanggansResponse = {
  data: Pelanggan[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type CreatePelangganPayload = {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type UpdatePelangganPayload = {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
};

// ===== MONITORING =====
export type MonitoringUser = {
  id_user: number;
  name: string;
  username: string;
  email: string;
};

export type MonitoringTipePs = {
  id_tipe: number;
  nama_tipe: string;
  harga_sewa: number;
};

export type MonitoringProduk = {
  id_produk: number;
  nama: string;
  jenis: string;
  harga: number;
  stock: number;
};

export type MonitoringDetailProduk = {
  id_detail_produk: number;
  id_produk: number;
  qty: number;
  subtotal: number;
  produk: MonitoringProduk | null;
};

export type MonitoringDetailSewa = {
  id_dt_booking: number;
  id_ps: number;
  jam_mulai: string;
  jam_selesai: string | null;
  durasi_menit?: number | null;
  durasi_jam?: number | null;
  harga_perjam: number;
  tipe_ps?: string | null;
  subtotal: number;
  playstation: {
    id_ps: number;
    nomor_ps: string;
    status_ps: "tersedia" | "digunakan" | "maintenance";
    tipe: MonitoringTipePs | null;
  } | null;
};

export type MonitoringTransaksi = {
  id_transaksi: number;
  tanggal: string;
  status_transaksi: string;
  sumber_transaksi: "admin";
  total_harga: number;
  user: MonitoringUser | null;
  detail_sewa: MonitoringDetailSewa[];
  detail_produk: MonitoringDetailProduk[];
  pembayaran?: MonitoringPembayaran | null;
};



export type MonitoringPlaystation = {
  id_ps: number;
  nomor_ps: string;
  status_ps: "tersedia" | "digunakan" | "maintenance";
  tipe: MonitoringTipePs | null;
  active_transaksi: MonitoringTransaksi | null;
};

// ===== TRANSAKSI =====
export type TransaksiDetailSewaPayload = {
  id_ps: number;
  jam_mulai: string;
  durasi_menit: number;
  durasi_jam?: number;
};

export type TransaksiDetailProdukPayload = {
  id_produk: number;
  qty: number;
};

export type CreateTransaksiPayload = {
  id_user: number;
  sumber_transaksi: "admin" | "aplikasi";
  sewa?: TransaksiDetailSewaPayload[];
  produk?: TransaksiDetailProdukPayload[];
};

export type TransaksiUser = {
  id_user: number;
  name: string;
  username: string;
  email: string;
};

export type TransaksiDetailSewa = {
  id_dt_booking: number;
  id_ps: number;
  jam_mulai: string;
  jam_selesai: string | null;
  durasi_menit?: number | null;
  durasi_jam?: number | null;
  harga_perjam: number;
  tipe_ps?: string | null;
  subtotal: number;
  playstation?: Playstation;
};

export type TransaksiDetailProduk = {
  id_detail_produk: number;
  id_produk: number;
  qty: number;
  subtotal: number;
  produk?: Produk;
};

export type TransaksiData = {
  id_transaksi: number;
  id_user: number;
  tanggal: string;
  total_harga: number;
  status_transaksi: string;
  sumber_transaksi: "admin";
  user?: TransaksiUser;
  detailSewa?: TransaksiDetailSewa[];
  detailProduk?: TransaksiDetailProduk[];
  detail_sewa?: TransaksiDetailSewa[];
  detail_produk?: TransaksiDetailProduk[];
  pembayaran?: MonitoringPembayaran | null;
};

export type TransaksiResponse = {
  message: string;
  data: MonitoringTransaksi;
};


// ===== PEMBAYARAN =====
export type MonitoringPembayaran = {
  id_pembayaran: number;
  id_transaksi: number;
  metode_pembayaran: "cash" | "online";
  total_bayar: number;
  kembalian: number;
  waktu_bayar: string | null;
  status_bayar: "menuggu" | "lunas" | "gagal" | "menunggu_validasi";
};

export type BayarTransaksiPayload = {
  metode_pembayaran: "cash" | "online";
  total_bayar?: number;
};

// ===== HELPER =====
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function publicHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const message = data.errors
      ? (Object.values(data.errors) as string[][]).flat().join(" ")
      : data.message || `Error ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ===== AUTH API =====
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

  if (typeof window !== "undefined") {
    localStorage.clear();
  }
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: authHeaders(),
  });
  return handleResponse<AuthUser>(res);
}

// ===== TIPE PS API =====
export async function getTipePs(): Promise<TipePs[]> {
  const res = await fetch(`${BASE_URL}/tipe-ps`, {
    headers: authHeaders(),
  });
  const result = await handleResponse<{ data: TipePs[] }>(res);
  return result.data;
}

export async function createTipePs(
  payload: Pick<TipePs, "nama_tipe" | "harga_sewa">
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
  payload: Partial<Pick<TipePs, "nama_tipe" | "harga_sewa">>
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

  const res = await fetch(url, {
    headers: authHeaders(),
  });
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

// ===== PRODUK API =====
export async function getProduk(params?: {
  jenis?: string;
  tersedia?: boolean;
}): Promise<Produk[]> {
  const url = new URL(`${BASE_URL}/produk`);

  if (params?.jenis) url.searchParams.set("jenis", params.jenis);
  if (params?.tersedia) url.searchParams.set("tersedia", "1");

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });
  const result = await handleResponse<{ data: Produk[] }>(res);
  return result.data;
}

export async function getProdukById(id: number): Promise<Produk> {
  const res = await fetch(`${BASE_URL}/produk/${id}`, {
    headers: authHeaders(),
  });
  const result = await handleResponse<{ data: Produk }>(res);
  return result.data;
}

export async function createProduk(payload: CreateProdukPayload): Promise<Produk> {
  const res = await fetch(`${BASE_URL}/produk`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<{ data: Produk }>(res);
  return result.data;
}

export async function updateProduk(
  id: number,
  payload: UpdateProdukPayload
): Promise<Produk> {
  const res = await fetch(`${BASE_URL}/produk/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<{ data: Produk }>(res);
  return result.data;
}

export async function deleteProduk(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/produk/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleResponse<{ message: string }>(res);
}

export async function updateStockProduk(
  id: number,
  payload: UpdateStockPayload
): Promise<UpdateStockResponse> {
  const res = await fetch(`${BASE_URL}/produk/${id}/stock`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<UpdateStockResponse>(res);
}

// ===== ADMIN API =====
export async function getAdmins(params?: {
  page?: number;
  search?: string;
  all?: boolean;
}): Promise<GetAdminsResponse> {
  const url = new URL(`${BASE_URL}/admin/admins`);

  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.all) url.searchParams.set("all", "1");

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  return handleResponse<GetAdminsResponse>(res);
}

export async function createAdmin(payload: CreateAdminPayload): Promise<Admin> {
  const res = await fetch(`${BASE_URL}/admin/admins`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<{ message: string; data: Admin }>(res);
  return result.data;
}

export async function updateAdmin(
  id: number,
  payload: UpdateAdminPayload
): Promise<Admin> {
  const res = await fetch(`${BASE_URL}/admin/admins/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<{ message: string; data: Admin }>(res);
  return result.data;
}

export async function deleteAdmin(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/admins/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  await handleResponse<{ message: string }>(res);
}

// ===== PELANGGAN API =====
export async function getPelanggans(params?: {
  page?: number;
  search?: string;
  all?: boolean;
}): Promise<GetPelanggansResponse> {
  const url = new URL(`${BASE_URL}/pelanggan`);

  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.all) url.searchParams.set("all", "1");

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  return handleResponse<GetPelanggansResponse>(res);
}

export async function createPelanggan(
  payload: CreatePelangganPayload
): Promise<Pelanggan> {
  const res = await fetch(`${BASE_URL}/pelanggan`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<{ message: string; data: Pelanggan }>(res);
  return result.data;
}

export async function updatePelanggan(
  id: number,
  payload: UpdatePelangganPayload
): Promise<Pelanggan> {
  const res = await fetch(`${BASE_URL}/pelanggan/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<{ message: string; data: Pelanggan }>(res);
  return result.data;
}

export async function deletePelanggan(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/pelanggan/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  await handleResponse<{ message: string }>(res);
}

// ===== MONITORING API =====
export async function getMonitoringPlaystation(): Promise<MonitoringPlaystation[]> {
  const res = await fetch(`${BASE_URL}/monitoring/playstation`, {
    headers: authHeaders(),
  });
  const result = await handleResponse<{ data: MonitoringPlaystation[] }>(res);
  return result.data;
}

// ===== TRANSAKSI API =====
export async function createTransaksi(
  payload: CreateTransaksiPayload
): Promise<MonitoringTransaksi> {
  const res = await fetch(`${BASE_URL}/transaksi`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<TransaksiResponse>(res);
  return result.data;
}

export async function getTransaksiById(id: number): Promise<TransaksiData> {
  const res = await fetch(`${BASE_URL}/transaksi/${id}`, {
    headers: authHeaders(),
  });

  const result = await handleResponse<{ data: TransaksiData }>(res);
  return result.data;
}

export async function selesaikanTransaksi(
  id: number
): Promise<MonitoringTransaksi> {
  const res = await fetch(`${BASE_URL}/transaksi/${id}/selesai`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  const result = await handleResponse<TransaksiResponse>(res);
  return result.data;
}

export async function batalkanTransaksi(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/transaksi/${id}/batal`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  await handleResponse<{ message: string }>(res);
}

export async function tambahProdukKeTransaksi(
  id: number,
  payload: { produk: { id_produk: number; qty: number }[] }
): Promise<MonitoringTransaksi> {
  const res = await fetch(`${BASE_URL}/transaksi/${id}/tambah-produk`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<TransaksiResponse>(res);
  return result.data;
}

export async function tambahWaktuTransaksi(
  id: number,
  payload: { menit_tambahan: number; id_ps?: number }
): Promise<MonitoringTransaksi> {
  const res = await fetch(`${BASE_URL}/transaksi/${id}/tambah-waktu`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<TransaksiResponse>(res);
  return result.data;
}


// ===== PEMBAYARAN API =====
export async function bayarTransaksi(
  id: number,
  payload: BayarTransaksiPayload
): Promise<MonitoringTransaksi> {
  const res = await fetch(`${BASE_URL}/transaksi/admin/${id}/bayar`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<TransaksiResponse>(res);
  return result.data;
}


export type GetTransaksiResponse = {
  data: TransaksiData[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export async function getTransaksis(params?: {
  page?: number;
  status?: string;
  tanggal?: string;
  user_id?: number;
  sumber_transaksi?: string;
}): Promise<GetTransaksiResponse> {
  const url = new URL(`${BASE_URL}/transaksi`);

  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.tanggal) url.searchParams.set("tanggal", params.tanggal);
  if (params?.user_id) url.searchParams.set("user_id", String(params.user_id));
  if (params?.sumber_transaksi) url.searchParams.set("sumber_transaksi", params.sumber_transaksi);

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });

  return handleResponse<GetTransaksiResponse>(res);
}

// APPROVE PELANGGAN
export type ApprovalBookingUser = {
  id_user: number;
  name: string;
  username: string;
  email: string;
};

export type ApprovalBookingPs = {
  id_ps: number;
  nomor_ps: string;
  status_ps: string;
  tipe?: {
    id_tipe: number;
    nama_tipe: string;
    harga_sewa?: number;
  } | null;
};

export type ApprovalBookingDetailSewa = {
  id_dt_booking: number;
  id_ps: number;
  jam_mulai: string;
  jam_selesai: string | null;
  durasi_menit?: number | null;
  durasi_jam?: number | null;
  subtotal?: number | null;
  playstation?: ApprovalBookingPs | null;
};

export type ApprovalBookingDetailProduk = {
  id_detail_produk: number;
  qty: number;
  subtotal?: number | null;
  produk?: {
    id_produk: number;
    nama: string;
    harga: number;
  } | null;
};

export type ApprovalBookingItem = {
  id_transaksi: number;
  tanggal: string;
  status_transaksi: string;
  sumber_transaksi: string;
  total_harga: number;
  user?: ApprovalBookingUser | null;
  detail_sewa?: ApprovalBookingDetailSewa[];
  detail_produk?: ApprovalBookingDetailProduk[];
  pembayaran?: {
    id_pembayaran: number;
    status_bayar: string;
    metode_pembayaran?: string | null;
    total_bayar?: number | null;
    waktu_bayar?: string | null;
  } | null;
};

export async function getWaitingBookings(): Promise<ApprovalBookingItem[]> {
  const res = await fetch(`${BASE_URL}/transaksi?status=waiting&sumber_transaksi=aplikasi`, {
    headers: authHeaders(),
  });

  const result = await handleResponse<{ data: ApprovalBookingItem[] }>(res);
  return result.data ?? [];
}

export async function approveBooking(id: number): Promise<ApprovalBookingItem> {
  const res = await fetch(`${BASE_URL}/transaksi/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  const result = await handleResponse<{ message: string; data: ApprovalBookingItem }>(res);
  return result.data;
}

export async function rejectBooking(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/transaksi/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  return handleResponse<{ message: string }>(res);
}

export type Pengguna = {
  id_user: number;
  name: string;
  username: string;
  email: string;
  role: "admin" | "pelanggan";
  created_at: string;
};

export type GetUsersResponse = {
  data: Pengguna[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type CreateUserPayload = {
  name: string;
  username: string;
  email: string;
  role: "admin" | "pelanggan";
  password: string;
  password_confirmation: string;
};

export type UpdateUserPayload = Partial<{
  name: string;
  username: string;
  email: string;
  role: "admin" | "pelanggan";
  password: string;
  password_confirmation: string;
}>;

function mapAdminToPengguna(admin: Admin): Pengguna {
  return {
    id_user: admin.id_user,
    name: admin.name,
    username: admin.username,
    email: admin.email,
    role: "admin",
    created_at: admin.created_at,
  };
}

function mapPelangganToPengguna(pelanggan: Pelanggan): Pengguna {
  return {
    id_user: pelanggan.id_user,
    name: pelanggan.name,
    username: pelanggan.username,
    email: pelanggan.email,
    role: "pelanggan",
    created_at: pelanggan.created_at,
  };
}

export async function getUsers(params?: {
  page?: number;
  search?: string;
  all?: boolean;
}): Promise<GetUsersResponse> {
  const [adminsRes, pelanggansRes] = await Promise.all([
    getAdmins({
      page: params?.page,
      search: params?.search,
      all: params?.all,
    }),
    getPelanggans({
      page: params?.page,
      search: params?.search,
      all: params?.all,
    }),
  ]);

  const admins = (adminsRes.data ?? []).map(mapAdminToPengguna);
  const pelanggans = (pelanggansRes.data ?? []).map(mapPelangganToPengguna);

  const data = [...admins, ...pelanggans].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    data,
    total: data.length,
    current_page: 1,
    last_page: 1,
    per_page: data.length,
  };
}

export async function createUser(
  payload: CreateUserPayload
): Promise<Pengguna> {
  if (payload.role === "admin") {
    const created = await createAdmin({
      name: payload.name,
      username: payload.username,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    });

    return mapAdminToPengguna(created);
  }

  const created = await createPelanggan({
    name: payload.name,
    username: payload.username,
    email: payload.email,
    password: payload.password,
    password_confirmation: payload.password_confirmation,
  });

  return mapPelangganToPengguna(created);
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload & { currentRole?: "admin" | "pelanggan" }
): Promise<Pengguna> {
  const roleTarget = payload.role ?? payload.currentRole;

  if (!roleTarget) {
    throw new Error("Role pengguna tidak diketahui saat update.");
  }

  const basePayload = {
    name: payload.name,
    username: payload.username,
    email: payload.email,
    password: payload.password,
    password_confirmation: payload.password_confirmation,
  };

  if (roleTarget === "admin") {
    const updated = await updateAdmin(id, basePayload);
    return mapAdminToPengguna(updated);
  }

  const updated = await updatePelanggan(id, basePayload);
  return mapPelangganToPengguna(updated);
}

export async function deleteUser(
  id: number,
  role: "admin" | "pelanggan"
): Promise<void> {
  if (role === "admin") {
    await deleteAdmin(id);
    return;
  }

  await deletePelanggan(id);
}


export type CashPendingItem = {
  id_transaksi: number;
  tanggal: string;
  total_harga: number;
  status_transaksi: string;
  sumber_transaksi?: string;

  user?: {
    id_user: number;
    name: string;
    username: string;
    email: string;
  } | null;

  pembayaran?: {
    id_pembayaran?: number;
    metode_pembayaran?: "cash" | "online" | string;
    total_bayar?: number;
    kembalian?: number;
    waktu_bayar?: string | null;
    status_bayar?: string;
  } | null;

  detail_sewa?: {
    id_dt_booking?: number;
    id_ps?: number;
    jam_mulai?: string;
    jam_selesai?: string | null;
    durasi_menit?: number | null;
    playstation?: {
      id_ps?: number;
      nomor_ps?: string;
      status_ps?: string;
      tipe?: {
        id_tipe?: number;
        nama_tipe?: string;
      } | null;
    } | null;
  }[];

  detail_produk?: {
    id_dt_produk?: number;
    qty?: number;
    subtotal?: number;
    produk?: {
      id_produk?: number;
      nama?: string;
      harga?: number;
    } | null;
  }[];
};

export async function getCashPendingPayments(): Promise<CashPendingItem[]> {
  const res = await fetch(`${BASE_URL}/pembayaran/cash-menunggu`, {
    headers: authHeaders(),
  });

  const result = await handleResponse<{ data: CashPendingItem[] }>(res);
  return result.data ?? [];
}

export async function konfirmasiCashPembayaran(
  id: number,
  payload: { total_bayar: number }
): Promise<{ message: string; data: CashPendingItem }> {
  const res = await fetch(`${BASE_URL}/pembayaran/${id}/konfirmasi-cash`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<{ message: string; data: CashPendingItem }>(res);
}

export type AdminDashboardNotification = {
  type: string;
  title: string;
  message: string;
  count: number;
  href: string;
};

export type AdminDashboardInformativeCard = {
  key: string;
  label: string;
  value: number;
  sub: string;
  color: string;
  href: string;
  is_currency?: boolean;
};

export type AdminDashboardChartPoint = {
  date: string;
  label: string;
  total: number;
};

export type AdminDashboardResponse = {
  message: string;
  data: {
    notifications: AdminDashboardNotification[];
    informative_cards: AdminDashboardInformativeCard[];
    omzet_chart: {
      week: AdminDashboardChartPoint[];
      month: AdminDashboardChartPoint[];
      year: AdminDashboardChartPoint[];
    };
    last_updated_at: string;
  };
};

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const res = await fetch(`${BASE_URL}/admin/dashboard`, {
    headers: authHeaders(),
    cache: "no-store",
  });

  return handleResponse<AdminDashboardResponse>(res);
}

export async function createQrisPayment(idTransaksi: number | string) {
  const res = await fetch(`${BASE_URL}/transaksi/${idTransaksi}/payment/qris`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });

  return handleResponse<{
    message: string;
    data: {
      transaksi: MonitoringTransaksi;
      payment: MonitoringPembayaran & {
        provider?: string | null;
        provider_order_id?: string | null;
        provider_transaction_id?: string | null;
        provider_payment_type?: string | null;
        provider_transaction_status?: string | null;
        provider_fraud_status?: string | null;
        qr_url?: string | null;
        qr_string?: string | null;
        expired_at?: string | null;
      };
      midtrans?: {
        order_id?: string;
        transaction_id?: string;
        payment_type?: string;
        transaction_status?: string;
        fraud_status?: string;
        expiry_time?: string;
        actions?: Array<{
          name?: string;
          method?: string;
          url?: string;
        }>;
        [key: string]: any;
      };
    };
  }>(res);
}

export async function checkQrisPaymentStatus(id: number) {
  const res = await fetch(`${BASE_URL}/transaksi/${id}/payment/qris/status`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  return handleResponse<any>(res);
}


// ===== PENGADUAN =====
// ===== PENGADUAN =====
export type PengaduanUser = {
  id_user: number;
  name: string;
  username: string;
  email: string;
  role?: string;
};

export type StatusPengaduan = "pending" | "proses" | "selesai" | "dibatalkan";

export type KategoriAduan =
  | "ps_rusak"
  | "pelayanan"
  | "kebersihan"
  | "pembayaran"
  | "fasilitas"
  | "lainnya";

export type PengaduanItem = {
  id: number;
  id_pengadu: number;
  id_admin?: number | null;
  judul_pengaduan: string;
  kategori_aduan: KategoriAduan;
  isi_pengaduan: string;
  foto_bukti?: string | null;
  status_pengaduan: StatusPengaduan;
  catatan_admin?: string | null;
  ditangani_pada?: string | null;
  diselesaikan_pada?: string | null;
  created_at: string;
  updated_at: string;
  pengadu?: PengaduanUser | null;
  admin?: PengaduanUser | null;
};

export type GetPengaduanResponse = {
  data: PengaduanItem[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  summary?: {
    total: number;
    aktif: number;
    pending: number;
    proses: number;
    selesai: number;
    dibatalkan: number;
  };
};

export type UpdateStatusPengaduanPayload = {
  status_pengaduan: StatusPengaduan;
  catatan_admin?: string | null;
};

export async function getAdminPengaduans(params?: {
  search?: string;
  status?: "aktif" | StatusPengaduan | "";
  kategori?: KategoriAduan | "";
  per_page?: number;
}): Promise<GetPengaduanResponse> {
  const url = new URL(`${BASE_URL}/admin/pengaduan`);

  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.kategori) url.searchParams.set("kategori", params.kategori);
  if (params?.per_page) url.searchParams.set("per_page", String(params.per_page));

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    cache: "no-store",
  });

  return handleResponse<GetPengaduanResponse>(res);
}

export async function getAdminPengaduanSelesai(params?: {
  search?: string;
  per_page?: number;
}): Promise<GetPengaduanResponse> {
  const url = new URL(`${BASE_URL}/admin/pengaduan/selesai`);

  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.per_page) url.searchParams.set("per_page", String(params.per_page));

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    cache: "no-store",
  });

  return handleResponse<GetPengaduanResponse>(res);
}

export async function updateStatusPengaduan(
  id: number,
  payload: UpdateStatusPengaduanPayload
): Promise<PengaduanItem> {
  const res = await fetch(`${BASE_URL}/admin/pengaduan/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<{
    message: string;
    data: PengaduanItem;
  }>(res);

  return result.data;
}

export async function deletePengaduan(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/pengaduan/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  await handleResponse<{ message: string }>(res);
}