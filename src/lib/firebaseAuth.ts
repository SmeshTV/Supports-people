import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  type User 
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

export const firebaseAuth = {
  register: async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      sendEmailVerification(result.user).catch(() => {});
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: formatAuthError(error.code) };
    }
  },

  login: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error: any) {
      return { user: null, error: formatAuthError(error.code) };
    }
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  resendVerification: async (user: User): Promise<string | null> => {
    try {
      await sendEmailVerification(user);
      return null;
    } catch (error: any) {
      return error.message;
    }
  },
};

function formatAuthError(code: string): string {
  const errors: Record<string, string> = {
    'auth/email-already-in-use': 'Этот email уже зарегистрирован. Попробуйте войти.',
    'auth/invalid-email': 'Введите корректный email адрес.',
    'auth/weak-password': 'Пароль должен быть минимум 6 символов.',
    'auth/user-not-found': 'Аккаунт с таким email не найден.',
    'auth/wrong-password': 'Неверный пароль. Попробуйте снова.',
    'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.',
    'auth/invalid-credential': 'Неверный email или пароль.',
    'auth/network-request-failed': 'Ошибка сети. Проверьте подключение.',
    'auth/user-disabled': 'Этот аккаунт отключен.',
    'auth/operation-not-allowed': 'Этот тип авторизации отключен.',
  };
  return errors[code] || 'Произошла ошибка. Попробуйте снова.';
}