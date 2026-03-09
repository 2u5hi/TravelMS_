import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AuthUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user: AuthUser | null = null;
  private base = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('tms_user');
    if (saved) this._user = JSON.parse(saved);
  }

  get user(): AuthUser | null { return this._user; }
  get isLoggedIn(): boolean { return !!this._user; }
  get isAdmin(): boolean { return this._user?.role === 'Admin'; }

  login(email: string, password: string) {
    return this.http.post<AuthUser>(`${this.base}/auth/login`, { email, password });
  }

  setUser(user: AuthUser) {
    this._user = user;
    localStorage.setItem('tms_user', JSON.stringify(user));
  }

  logout() {
    this._user = null;
    localStorage.removeItem('tms_user');
  }
}
