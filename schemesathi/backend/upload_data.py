import pandas as pd
from firebase_config import get_firestore_db
import os

def upload_data():
    csv_file = "schemes_sample.csv"
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found.")
        return

    try:
        db = get_firestore_db()
    except Exception as e:
        print(f"Error connecting to Firebase: {e}")
        return

    df = pd.read_csv(csv_file)
    
    # Collection name
    collection_name = "schemes"
    collection_ref = db.collection(collection_name)

    print(f"Uploading {len(df)} schemes to Firestore collection '{collection_name}'...")

    count = 0
    for _, row in df.iterrows():
        # Convert row to dict
        data = row.to_dict()
        
        # Clean data (handle NaN)
        cleaned_data = {k: (v if pd.notna(v) else "") for k, v in data.items()}
        
        # Parse Lists: 'eligibleCaste' and 'occupation'
        # Assumes CSV has comma-separated values e.g. "SC,ST" or "Farmer"
        if "eligibleCaste" in cleaned_data and isinstance(cleaned_data["eligibleCaste"], str):
             # Split by comma and strip whitespace
             cleaned_data["eligibleCaste"] = [x.strip() for x in cleaned_data["eligibleCaste"].split(",")]
        
        if "occupation" in cleaned_data and isinstance(cleaned_data["occupation"], str):
             cleaned_data["occupation"] = [x.strip() for x in cleaned_data["occupation"].split(",")]

        # Add to Firestore. Let Firestore generate ID.
        collection_ref.add(cleaned_data)
        count += 1
        print(f"Uploaded: {cleaned_data.get('schemeName')}")

    print(f"Successfully uploaded {count} documents.")

if __name__ == "__main__":
    upload_data()
