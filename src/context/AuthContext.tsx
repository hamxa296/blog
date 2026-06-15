import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  getUserProfile, 
  updateUserProfile, 
  logoutUser, 
  type UserProfile, 
  isAdminUID 
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const refreshProfile = async () => {
    if (user) {
      const res = await getUserProfile(user.uid);
      if (res.success && res.profile) {
        setProfile(res.profile);
        setIsAdmin(res.profile.isAdmin === true);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profileRes = await getUserProfile(firebaseUser.uid);
          if (profileRes.success && profileRes.profile) {
            const p = profileRes.profile;
            if (p.isBlocked) {
              await logoutUser();
              setUser(null);
              setProfile(null);
              setIsAdmin(false);
            } else {
              // Automatically check if they are in the ADMIN_UIDS and promote if needed
              if (isAdminUID(firebaseUser.uid) && !p.isAdmin) {
                p.isAdmin = true;
                await updateUserProfile(firebaseUser.uid, { isAdmin: true });
              }
              setUser(firebaseUser);
              setProfile(p);
              setIsAdmin(p.isAdmin === true);
            }
          } else {
            // Document does not exist in Firestore yet (should only happen if signup sync failed)
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || '',
            };
            if (isAdminUID(firebaseUser.uid)) {
              newProfile.isAdmin = true;
            }
            await updateUserProfile(firebaseUser.uid, newProfile);
            setUser(firebaseUser);
            setProfile(newProfile);
            setIsAdmin(newProfile.isAdmin === true);
          }
        } catch (error) {
          console.error("Error loading user profile in context:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
