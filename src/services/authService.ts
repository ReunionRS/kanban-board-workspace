import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { FirestoreService } from './firestoreService';
import { User as KanbanUser } from '@/types/kanban';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  profession: string;
  role: 'owner' | 'admin' | 'participant' | 'observer';
  telegramId: string | null;
  telegramUsername: string | null;
  telegramChatId?: string | null; 
  telegramLinked?: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  private static instance: AuthService;
  private googleProvider: GoogleAuthProvider;

  private constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithGoogle(): Promise<{ user: User; isNewUser: boolean }> {
    try {
      console.log('AuthService: Starting Google sign in...');
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = result.user;
      console.log('AuthService: Google sign in successful, user:', user.email);

      const existingProfile = await FirestoreService.getUserByEmail(user.email!);
      const isNewUser = !existingProfile;
      console.log('AuthService: Existing profile:', existingProfile, 'isNewUser:', isNewUser);

      if (isNewUser) {
        console.log('AuthService: Creating new user profile...');
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'Пользователь',
          email: user.email || '',
          avatar: user.photoURL || '',
          profession: 'unknown', 
          role: 'participant',
          telegramId: null,
          telegramUsername: null,
          telegramChatId: null, 
          telegramLinked: false, 
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await FirestoreService.saveUser(newProfile);
        FirestoreService.setCurrentUser(newProfile);
        console.log('AuthService: New profile created and cached');
        return { user, isNewUser: true };
      } else {
        console.log('AuthService: Updating existing profile...');
        const updatedProfile: UserProfile = {
          uid: existingProfile.id,
          name: user.displayName || existingProfile.name || 'Пользователь',
          email: existingProfile.email || '',
          avatar: user.photoURL || existingProfile.avatar || '',
          profession: existingProfile.profession || 'unknown',
          role: existingProfile.role || 'participant',
          telegramId: existingProfile.telegramId || null,
          telegramUsername: existingProfile.telegramUsername || null,
          telegramChatId: existingProfile.telegramChatId || null, 
          telegramLinked: existingProfile.telegramLinked || false, 
          createdAt: existingProfile.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        await FirestoreService.saveUser(updatedProfile);
        FirestoreService.setCurrentUser(updatedProfile);
        console.log('AuthService: Existing profile updated and cached');
        return { user, isNewUser: false };
      }
    } catch (error) {
      console.error('AuthService: Google sign-in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('AuthService: Signing out...');
      await firebaseSignOut(auth);
      FirestoreService.clearCurrentUser();
      console.log('AuthService: Sign out complete');
    } catch (error) {
      console.error('AuthService: Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): UserProfile | null {
    const user = FirestoreService.getCurrentUser();
    console.log('AuthService: getCurrentUser returning:', user);
    return user;
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Пользователь не авторизован');
    }

    console.log('AuthService: Updating profile with:', updates);

    const updatedProfile: UserProfile = {
      ...currentUser,
      ...updates,
      updatedAt: new Date()
    };

    await FirestoreService.saveUser(updatedProfile);
    FirestoreService.setCurrentUser(updatedProfile);
    
    console.log('AuthService: Profile updated:', updatedProfile);
    return updatedProfile;
  }

  async linkTelegramAccount(telegramId: string, username?: string, chatId?: string): Promise<UserProfile> {
    return this.updateUserProfile({
      telegramId,
      telegramUsername: username || null,
      telegramChatId: chatId || null,
      telegramLinked: true
    });
  }

  async unlinkTelegramAccount(): Promise<UserProfile> {
    return this.updateUserProfile({
      telegramId: null,
      telegramUsername: null,
      telegramChatId: null,
      telegramLinked: false
    });
  }

  onAuthStateChanged(callback: (user: User | null, profile: UserProfile | null) => void) {
    return onAuthStateChanged(auth, async (user) => {
      console.log('AuthService: Auth state changed, user:', user?.email);
      
      if (user) {
        let profile = FirestoreService.getCurrentUser();
        
        if (!profile) {
          console.log('AuthService: No cached profile, loading from Firestore...');
          const firestoreUser = await FirestoreService.getUserByEmail(user.email!);
          if (firestoreUser) {
            profile = {
              uid: firestoreUser.id,
              name: firestoreUser.name,
              email: firestoreUser.email,
              avatar: firestoreUser.avatar,
              profession: firestoreUser.profession || 'unknown',
              role: firestoreUser.role || 'participant',
              telegramId: firestoreUser.telegramId || null,
              telegramUsername: firestoreUser.telegramUsername || null,
              telegramChatId: firestoreUser.telegramChatId || null, 
              telegramLinked: firestoreUser.telegramLinked || false, 
              createdAt: firestoreUser.createdAt || new Date(),
              updatedAt: firestoreUser.updatedAt || new Date()
            };
            FirestoreService.setCurrentUser(profile);
          }
        }
        
        callback(user, profile);
      } else {
        callback(null, null);
      }
    });
  }

  async isNewUser(email: string): Promise<boolean> {
    const user = await FirestoreService.getUserByEmail(email);
    return !user;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const users = await FirestoreService.getUsers();
    return users.map((user: KanbanUser) => ({
      uid: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      profession: user.profession || 'unknown',
      role: user.role || 'participant',
      telegramId: user.telegramId || null,
      telegramUsername: user.telegramUsername || null,
      telegramChatId: user.telegramChatId || null, 
      telegramLinked: user.telegramLinked || false, 
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    }));
  }

  hasTelegramLinked(): boolean {
    const user = this.getCurrentUser();
    return !!(user?.telegramLinked && user?.telegramChatId);
  }

  async initializeDefaultData(user: UserProfile): Promise<void> {
    console.log('AuthService: Initializing default data for:', user.email);
    await FirestoreService.initializeDefaultData(user);
  }
}