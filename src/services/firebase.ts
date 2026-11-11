import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const isFirebaseConfigured = Boolean(
  firebaseConfig &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== '' &&
  firebaseConfig.projectId !== 'remixed-project-id'
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

export { app, db, auth };

export interface DbConnectionInfo {
  status: 'connected' | 'demo' | 'checking';
  isDemo: boolean;
  message: string;
  projectId?: string;
  authUid?: string | null;
}

let currentDbInfo: DbConnectionInfo = {
  status: 'demo',
  isDemo: true,
  message: 'Demo Mode：本地模拟数据库运行中，绝不伪称已连接真实云端数据库。',
  projectId: firebaseConfig?.projectId || undefined,
  authUid: null,
};

const statusListeners = new Set<(info: DbConnectionInfo) => void>();

function notifyListeners() {
  statusListeners.forEach((listener) => {
    try {
      listener(currentDbInfo);
    } catch (e) {
      console.error('Error in status listener', e);
    }
  });
}

export function subscribeDbStatus(listener: (info: DbConnectionInfo) => void): () => void {
  statusListeners.add(listener);
  listener(currentDbInfo);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getDbConnectionInfo(): DbConnectionInfo {
  return currentDbInfo;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Ensures anonymous authentication is initialized for students.
 * Guarantees a unique anonymous UID per session/browser.
 */
export async function ensureAnonymousAuth(): Promise<string | null> {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  try {
    if (auth.currentUser) {
      currentDbInfo.authUid = auth.currentUser.uid;
      notifyListeners();
      return auth.currentUser.uid;
    }
    const cred = await signInAnonymously(auth);
    currentDbInfo.authUid = cred.user.uid;
    notifyListeners();
    return cred.user.uid;
  } catch (err) {
    console.warn('Anonymous sign-in not available or failed:', err);
    return null;
  }
}

/**
 * Validates connection to Firestore at application boot (per Firebase skill guidelines)
 */
export async function testConnection(): Promise<DbConnectionInfo> {
  if (!isFirebaseConfigured || !db) {
    currentDbInfo = {
      status: 'demo',
      isDemo: true,
      message: 'Demo Mode：未配置 Firebase，已切换至本地安全模拟数据库。',
      projectId: firebaseConfig?.projectId,
      authUid: null,
    };
    notifyListeners();
    return currentDbInfo;
  }

  try {
    // Attempt anonymous sign-in first: student identity and scores require authenticated UID
    const anonUid = await ensureAnonymousAuth();
    if (!anonUid) {
      currentDbInfo = {
        status: 'demo',
        isDemo: true,
        message: 'Demo Mode：Firebase 匿名身份验证尚未在控制台启用，系统已安全使用本地模拟数据库，绝不伪称已连接。',
        projectId: firebaseConfig.projectId,
        authUid: null,
      };
      notifyListeners();
      return currentDbInfo;
    }

    // Per skill: call getDocFromServer to verify live connection
    await getDocFromServer(doc(db, 'settings', 'global'));
    currentDbInfo = {
      status: 'connected',
      isDemo: false,
      message: 'Firebase Firestore 云端数据库与匿名身份验证已成功连接。',
      projectId: firebaseConfig.projectId,
      authUid: anonUid,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('Firestore live test failed, falling back to Demo Mode:', errorMsg);

    currentDbInfo = {
      status: 'demo',
      isDemo: true,
      message: `Demo Mode：未能连接真实云端数据库 (${errorMsg.includes('offline') ? '客户端离线' : '未授权或服务未配置'})，已采用本地模拟数据库，绝不伪称已连接。`,
      projectId: firebaseConfig.projectId,
      authUid: null,
    };
  }

  notifyListeners();
  return currentDbInfo;
}

// Automatically trigger test connection on module load in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection();
  }, 100);

  if (auth) {
    onAuthStateChanged(auth, (user) => {
      currentDbInfo.authUid = user ? user.uid : null;
      notifyListeners();
    });
  }
}
