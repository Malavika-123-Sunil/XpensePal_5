// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQaHyx81V1b8q7-7XWLP9UlW4zjTd0SC8",
    authDomain: "xpensepal-a5042.firebaseapp.com",
    projectId: "xpensepal-a5042",
    storageBucket: "xpensepal-a5042.firebasestorage.app",
    messagingSenderId: "14137785761",
    appId: "1:14137785761:web:592af038e9a388013f9fe0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to handle user signup with detailed logging
async function handleSignup(event) {
    event.preventDefault();
    console.log('Starting signup process...');

    // Get form values
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();

    console.log('Form data collected:', { email, name, phone });

    try {
        // Step 1: Create Authentication user
        console.log('Creating authentication user...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Authentication user created successfully:', user.uid);

        // Step 2: Update Authentication profile
        console.log('Updating authentication profile...');
        await updateProfile(user, {
            displayName: name
        });
        console.log('Authentication profile updated successfully');

        // Step 3: Create Firestore user document
        console.log('Creating Firestore document...');
        const userData = {
            uid: user.uid,
            email: email,
            name: name,
            phone: phone,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            lastSeen: serverTimestamp(),
            rooms: [],
            profileComplete: true,
            totalExpenses: 0,
            totalPayments: 0,
            profileImageUrl: '',
            settings: {
                notifications: true,
                emailUpdates: true,
                currency: 'USD'
            }
        };

        // Create reference to user document
        const userDocRef = doc(db, 'users', user.uid);
        console.log('Attempting to save to Firestore...');
        
        // Save to Firestore
        await setDoc(userDocRef, userData);
        console.log('Firestore document created successfully');

        // Success message
        alert('Account created successfully!');
        console.log('Complete signup process successful');
        
        // Redirect to login page
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Error during signup:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Cleanup if needed
        if (auth.currentUser) {
            try {
                await auth.currentUser.delete();
                console.log('Cleaned up authentication user after error');
            } catch (deleteError) {
                console.error('Error during cleanup:', deleteError);
            }
        }
        
        alert(`Signup failed: ${error.message}`);
    }
}

// Function to handle user login with Firestore update
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user's last login in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            lastLogin: serverTimestamp(),
            lastSeen: serverTimestamp()
        });

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error during login:', error);
        alert('Login failed: ' + error.message);
    }
}

// Function to check auth state and sync with Firestore
function checkAuthState() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Check if user document exists in Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // If document doesn't exist, create it
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || '',
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp(),
                        lastSeen: serverTimestamp(),
                        rooms: [],
                        profileComplete: false
                    });
                } else {
                    // Update last seen
                    await updateDoc(userDocRef, {
                        lastSeen: serverTimestamp()
                    });
                }
            } catch (error) {
                console.error('Error checking/updating user document:', error);
            }
        } else {
            // User is signed out
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('signup.html')) {
                window.location.href = 'login.html';
            }
        }
    });
}

// Function to update user profile
async function updateUserProfile(userData) {
    if (!auth.currentUser) {
        throw new Error('No user is currently logged in');
    }

    try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        
        // Update Firestore
        await updateDoc(userDocRef, {
            ...userData,
            lastUpdated: serverTimestamp()
        });

        // Update Auth profile if name is provided
        if (userData.name) {
            await updateProfile(auth.currentUser, {
                displayName: userData.name
            });
        }

        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Function to handle logout
async function handleLogout() {
    try {
        if (auth.currentUser) {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            
            // Update last seen before logging out
            await updateDoc(userDocRef, {
                lastSeen: serverTimestamp()
            });
        }
        
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Logout failed: ' + error.message);
    }
}

// Add event listener to signup form
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        console.log('Signup form listener attached');
    } else {
        console.error('Signup form not found in document');
    }
}); 