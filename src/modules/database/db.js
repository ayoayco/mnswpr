import firebase from 'firebase/app';
import 'firebase/firestore';

export class DatabaseService {
    constructor() {
        // keys to interact with firebase
        // not a secret: https://stackoverflow.com/questions/37482366/is-it-safe-to-expose-firebase-apikey-to-the-public/37484053#37484053
        // but better moved to an environment variable
        const config = {
            apiKey: "AIzaSyAbDzNHCSFh59e3r5sZA4_2ZHJnJ6SCCxM",
            authDomain: "moment-188701.firebaseapp.com",
            databaseURL: "https://moment-188701.firebaseio.com",
            projectId: "secure-moment-188701",
            storageBucket: "secure-moment-188701.appspot.com",
            messagingSenderId: "113827947104",
            appId: "1:113827947104:web:b176f746d8358302c51905"
        };
        firebase.initializeApp(config);
        this.store = firebase.firestore();
    }
}