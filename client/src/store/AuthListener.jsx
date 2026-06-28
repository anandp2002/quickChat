import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { setUser, clearUser } from '@/store/slices/authSlice';

/**
 * Subscribes to Firebase `onAuthStateChanged` and syncs
 * auth state into the Redux store.
 *
 * Renders nothing — mount once at the app root.
 *
 * We extract only serializable fields from the Firebase User
 * to keep the Redux store fully serializable.
 */
export function AuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        dispatch(
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }),
        );
      } else {
        dispatch(clearUser());
      }
    });

    return unsubscribe;
  }, [dispatch]);

  return null;
}
