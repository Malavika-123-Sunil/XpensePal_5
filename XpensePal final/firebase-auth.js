import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { app } from './firebase-app.js';

// Initialize Firebase Auth
const auth = getAuth(app);

// Create user with email and password
async function createUser(email, password, name) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile with name
        await updateProfile(user, {
            displayName: name
        });
        
        return user;
    } catch (error) {
        throw error;
    }
}

// Sign in with email and password
async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Sign out
async function signOutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        throw error;
    }
}

// Get current user
function getCurrentUser() {
    return auth.currentUser;
}

// Listen for auth state changes
function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}

export {
    auth,
    createUser,
    signIn,
    signOutUser,
    getCurrentUser,
    onAuthStateChange
}; 