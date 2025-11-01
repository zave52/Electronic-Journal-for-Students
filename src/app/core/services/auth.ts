import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;
const STORAGE_KEY = 'currentUser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

}
