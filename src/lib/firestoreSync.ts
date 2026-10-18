import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { DeviceItem, CompanyProfile } from '../types/device';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Save user devices to Firestore under their user account
 */
export async function saveUserDevicesToCloud(userId: string, devices: DeviceItem[]): Promise<void> {
  const path = `users/${userId}/data/devices`;
  try {
    const docRef = doc(db, 'users', userId, 'data', 'devices');
    await setDoc(docRef, {
      items: devices,
      ownerEmail: auth.currentUser?.email || '',
      updatedAt: new Date().toISOString(),
      count: devices.length,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Load user devices from Firestore
 */
export async function loadUserDevicesFromCloud(userId: string): Promise<DeviceItem[] | null> {
  const path = `users/${userId}/data/devices`;
  try {
    const docRef = doc(db, 'users', userId, 'data', 'devices');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items)) {
        return data.items as DeviceItem[];
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save Company Profile to user's Firestore cloud account
 */
export async function saveUserCompanyProfileToCloud(userId: string, profile: CompanyProfile): Promise<void> {
  const path = `users/${userId}/profile/info`;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'info');
    await setDoc(docRef, {
      ...profile,
      ownerEmail: auth.currentUser?.email || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load Company Profile from user's Firestore cloud account
 */
export async function loadUserCompanyProfileFromCloud(userId: string): Promise<CompanyProfile | null> {
  const path = `users/${userId}/profile/info`;
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'info');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CompanyProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Real-time listener for user devices in Firestore
 */
export function listenToUserDevicesFromCloud(
  userId: string,
  onUpdate: (devices: DeviceItem[]) => void
): () => void {
  const path = `users/${userId}/data/devices`;
  const docRef = doc(db, 'users', userId, 'data', 'devices');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.items)) {
          onUpdate(data.items as DeviceItem[]);
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
