export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  expiresAt: string // ISO 8601
  username: string
}
