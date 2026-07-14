export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationCredentials extends LoginCredentials {
  displayName: string;
}
