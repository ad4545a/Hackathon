import firebase_admin
from firebase_admin import credentials, firestore
import os

# Singleton instance
_db = None

def get_firestore_db():
    global _db
    if _db is None:
        # Robust path finding
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cred_path = os.path.join(base_dir, "serviceAccountKey.json")
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            # Check if app is already initialized to avoid ValueError
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            else:
                 pass  
        else:
             print(f"WARNING: {cred_path} not found.")
             raise FileNotFoundError(f"Could not find {cred_path}. Please place it in {base_dir}")

        _db = firestore.client()
    
    return _db
