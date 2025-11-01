import { Injectable, inject } from '@angular/core';
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

        localStorage.setItem(STORAGE_KEY, JSON.stringify(userToStore));

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
    localStorage.removeItem(STORAGE_KEY);
    this.currentUserSubject.next(null);
  }
}
