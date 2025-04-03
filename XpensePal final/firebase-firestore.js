import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, serverTimestamp, enableIndexedDbPersistence } from 'firebase/firestore';
import { app } from './firebase-app.js';

// Initialize Firestore
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    });

// Create or update a document
async function setDocument(collectionName, docId, data) {
    try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, {
            ...data,
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        throw error;
    }
}

// Get a document
async function getDocument(collectionName, docId) {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        throw error;
    }
}

// Update a document
async function updateDocument(collectionName, docId, data) {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
            ...data,
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        throw error;
    }
}

// Query documents
async function queryDocuments(collectionName, field, operator, value) {
    try {
        const q = query(collection(db, collectionName), where(field, operator, value));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
}

// Get collection reference
function getCollection(collectionName) {
    return collection(db, collectionName);
}

// Get document reference
function getDocumentRef(collectionName, docId) {
    return doc(db, collectionName, docId);
}

const roomCodesCollection = collection(db, 'room_codes');

export {
    db,
    setDocument,
    getDocument,
    updateDocument,
    queryDocuments,
    getCollection,
    getDocumentRef,
    serverTimestamp
}; 