import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import { ScoreRecord } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Validate connection to Firestore on boot (as required by skill)
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is disconnected.');
      return false;
    }
    // Any other response (like permission or not found) means connection reached server
    return true;
  }
}

/**
 * Upload a player's score to the global Firestore leaderboard
 */
export async function saveScoreToFirestore(scoreRecord: ScoreRecord): Promise<void> {
  try {
    const docId = scoreRecord.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docRef = doc(db, 'scores', docId);
    
    await setDoc(docRef, {
      id: docId,
      playerName: scoreRecord.playerName || 'ผู้เล่นนิรนาม',
      score: scoreRecord.score || 0,
      mode: scoreRecord.mode,
      maxScore: scoreRecord.maxScore || 0,
      stars: scoreRecord.stars || 0,
      date: scoreRecord.date || new Date().toLocaleDateString('th-TH'),
      timeSpentSec: scoreRecord.timeSpentSec || 0,
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving score to Firebase:', err);
  }
}

/**
 * Fetch top scores from the global Firestore collection
 */
export async function fetchGlobalScoresFromFirestore(): Promise<ScoreRecord[]> {
  try {
    const scoresCol = collection(db, 'scores');
    const q = query(scoresCol, orderBy('score', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    const results: ScoreRecord[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      results.push({
        id: data.id || docSnap.id,
        playerName: data.playerName || 'ผู้เล่น',
        avatar: '', // avatars removed per user specification
        score: data.score,
        mode: data.mode,
        maxScore: data.maxScore,
        stars: data.stars,
        date: data.date,
        timeSpentSec: data.timeSpentSec,
      });
    });

    return results;
  } catch (err) {
    console.warn('Could not fetch from Firestore, falling back to local scores:', err);
    return [];
  }
}

/**
 * Subscribe to real-time global leaderboard updates
 */
export function subscribeToGlobalLeaderboard(onUpdate: (scores: ScoreRecord[]) => void): () => void {
  try {
    const scoresCol = collection(db, 'scores');
    const q = query(scoresCol, orderBy('score', 'desc'), limit(50));

    return onSnapshot(q, (snapshot) => {
      const results: ScoreRecord[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        results.push({
          id: data.id || docSnap.id,
          playerName: data.playerName || 'ผู้เล่น',
          avatar: '',
          score: data.score,
          mode: data.mode,
          maxScore: data.maxScore,
          stars: data.stars,
          date: data.date,
          timeSpentSec: data.timeSpentSec,
        });
      });
      if (results.length > 0) {
        onUpdate(results);
      }
    }, (error) => {
      console.warn('Leaderboard real-time listener error:', error);
    });
  } catch {
    return () => {};
  }
}

/**
 * Clear all cloud scores when passcode 237280 is confirmed
 */
export async function clearFirestoreScores(): Promise<void> {
  try {
    const scoresCol = collection(db, 'scores');
    const snapshot = await getDocs(scoresCol);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.error('Failed to clear Firestore scores:', err);
  }
}
