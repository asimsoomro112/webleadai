import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppNotification, AppSettings, Lead, AgentTask, UserAccount } from './types';
import { DEFAULT_SETTINGS, SEED_LEADS } from './store';

// Helper to remove undefined properties before writing to Firestore
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// ---------------- USER PROFILE ---------------- //

export async function getUserProfile(uid: string): Promise<UserAccount | null> {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (err) {
    console.error('Error getting user profile from Firestore:', err);
    return null;
  }
}

export async function saveUserProfile(uid: string, profileData: Partial<UserAccount>): Promise<void> {
  try {
    const ref = doc(db, 'users', uid);
    const cleaned = cleanForFirestore({
      ...profileData,
      uid,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, cleaned, { merge: true });
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
    throw err;
  }
}

// ---------------- USER SETTINGS & API KEY POOL ---------------- //

export async function getUserSettings(uid: string): Promise<AppSettings | null> {
  try {
    const ref = doc(db, 'users', uid, 'settings', 'general');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
    return null;
  } catch (err) {
    console.error('Error getting user settings from Firestore:', err);
    return null;
  }
}

export async function saveUserSettings(uid: string, settings: Partial<AppSettings>): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'settings', 'general');
    const cleaned = cleanForFirestore({
      ...settings,
      userId: uid,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, cleaned, { merge: true });
  } catch (err) {
    console.error('Error saving user settings to Firestore:', err);
    throw err;
  }
}

export function subscribeUserSettings(
  uid: string,
  onUpdate: (settings: AppSettings | null) => void
): () => void {
  const ref = doc(db, 'users', uid, 'settings', 'general');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as AppSettings);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Error in settings snapshot:', err);
    }
  );
}

// ---------------- USER LEADS PIPELINE ---------------- //

export function subscribeUserLeads(
  uid: string,
  onUpdate: (leads: Lead[]) => void
): () => void {
  const colRef = collection(db, 'users', uid, 'leads');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const leads: Lead[] = [];
      snapshot.forEach((d) => {
        leads.push(d.data() as Lead);
      });
      onUpdate(leads);
    },
    (err) => {
      console.error('Error in leads snapshot:', err);
    }
  );
}

export async function saveUserLead(uid: string, lead: Lead): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'leads', lead.id);
    const cleaned = cleanForFirestore({
      ...lead,
      userId: uid,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, cleaned, { merge: true });
  } catch (err) {
    console.error('Error saving lead to Firestore:', err);
    throw err;
  }
}

export async function deleteUserLead(uid: string, leadId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'leads', leadId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('Error deleting lead from Firestore:', err);
    throw err;
  }
}

export async function seedInitialUserLeadsIfEmpty(uid: string): Promise<Lead[]> {
  try {
    const colRef = collection(db, 'users', uid, 'leads');
    const existingSnap = await getDoc(doc(colRef, 'lead_1'));
    if (!existingSnap.exists()) {
      const batch = writeBatch(db);
      const leadsToSeed = SEED_LEADS.slice(0, 4).map((l) => ({
        ...l,
        userId: uid,
      }));
      for (const lead of leadsToSeed) {
        const ref = doc(colRef, lead.id);
        batch.set(ref, cleanForFirestore(lead));
      }
      await batch.commit();
      return leadsToSeed;
    }
    return [];
  } catch (err) {
    console.error('Error seeding initial leads to Firestore:', err);
    return [];
  }
}

// ---------------- USER NOTIFICATIONS ---------------- //

export function subscribeUserNotifications(
  uid: string,
  onUpdate: (notifs: AppNotification[]) => void
): () => void {
  const colRef = collection(db, 'users', uid, 'notifications');
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((d) => {
        notifs.push(d.data() as AppNotification);
      });
      onUpdate(notifs);
    },
    (err) => {
      console.error('Error in notifications snapshot:', err);
    }
  );
}

export async function addUserNotification(
  uid: string,
  notification: Omit<AppNotification, 'id'> & { id?: string }
): Promise<void> {
  try {
    const id = notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ref = doc(db, 'users', uid, 'notifications', id);
    const cleaned = cleanForFirestore({
      ...notification,
      id,
      userId: uid,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: notification.read || false,
    });
    await setDoc(ref, cleaned);
  } catch (err) {
    console.error('Error adding user notification:', err);
  }
}

export async function markNotificationAsRead(uid: string, notifId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'notifications', notifId);
    await setDoc(ref, { read: true }, { merge: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
  }
}

export async function markAllNotificationsAsRead(uid: string, notifIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const id of notifIds) {
      const ref = doc(db, 'users', uid, 'notifications', id);
      batch.update(ref, { read: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Error marking all notifications read:', err);
  }
}

// ---------------- USER AGENT TASKS ---------------- //

export function subscribeUserTasks(
  uid: string,
  onUpdate: (tasks: AgentTask[]) => void
): () => void {
  const colRef = collection(db, 'users', uid, 'tasks');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: AgentTask[] = [];
      snapshot.forEach((d) => {
        tasks.push(d.data() as AgentTask);
      });
      onUpdate(tasks);
    },
    (err) => {
      console.error('Error in tasks snapshot:', err);
    }
  );
}

export async function saveUserTask(uid: string, task: AgentTask): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'tasks', task.id);
    const cleaned = cleanForFirestore({
      ...task,
      userId: uid,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, cleaned, { merge: true });
  } catch (err) {
    console.error('Error saving user task:', err);
  }
}
