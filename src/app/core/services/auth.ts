import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { User } from '../models';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;
const STORAGE_KEY = 'currentUser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Authenticate user with email and password
   * @param credentials Object containing email and password
   * @returns Observable<User> on successful login
   */
  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.get<User[]>(`${API_URL}/users?email=${credentials.email}`).pipe(
      map(users => {
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);

        if (!user) {
          throw new Error('Invalid email or password');
        }

        return user;
      }),
      tap(user => {
        const userToStore = { ...user };
        delete userToStore.password;

        if (this.isBrowser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userToStore));
        }

        this.currentUserSubject.next(userToStore);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => new Error('Authentication failed'));
      })
    );
  }

  /**
   * Log out the current user
   * Clears user data from localStorage and resets the current user state
   */
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.currentUserSubject.next(null);
  }

  /**
   * Check if a user is currently logged in
   * @returns boolean indicating authentication status
   */
  isLoggedIn(): boolean {
    return this.getUserFromStorage() !== null;
  }

  /**
   * Get the currently logged in user
   * @returns User object or null if not authenticated
   */
  getCurrentUser(): User | null {
    return this.getUserFromStorage();
  }

  /**
   * Get the role of the currently logged in user
   * @returns User role string or null if not authenticated
   */
  getUserRole(): string | null {
    const user = this.getUserFromStorage();
    return user ? user.role : null;
  }

  getCurrentUserId(): string | null {
    const user = localStorage.getItem('currentUser');

    if (!user) return null;

    try {
      return JSON.parse(user).id;
    } catch (e) {
      return null;
    }
  }

  /**
   * Private helper method to retrieve and parse user data from localStorage
   * @returns User object or null if not found or invalid
   */
  private getUserFromStorage(): User | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const userJson = localStorage.getItem(STORAGE_KEY);
      if (!userJson) {
        return null;
      }
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  }
}
