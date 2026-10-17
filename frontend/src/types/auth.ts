export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  especialidad: string;
  rol: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
