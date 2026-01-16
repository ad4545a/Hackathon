from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional
from firebase_config import get_firestore_db
from models import SchemeResponse, UserProfile, PaginatedSchemes
import firebase_admin

app = FastAPI(title="SchemeSathi Backend", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Welcome to SchemeSathi Backend (Firestore Edition)"}

def map_firestore_to_schema(doc) -> dict:
    data = doc.to_dict()
    data['id'] = doc.id
    # Synthesize 'eligibility' text for UI display
    min_age = data.get('minAge', 0)
    max_age = data.get('maxAge', 100)
    income = data.get('incomeLimit', 0)
    caste = data.get('eligibleCaste', ['All'])
    data['eligibility'] = f"Age: {min_age}-{max_age}, Income < {income}, Caste: {caste}"
    
    # Determine is_central
    data['is_central'] = (data.get('state') == 'All India')
    
    # ministry default
    data['ministry'] = "Government Dept"
    
    return data

@app.get("/schemes", response_model=PaginatedSchemes)
def read_schemes(skip: int = 0, limit: int = 10, search: Optional[str] = None):
    try:
        db = get_firestore_db()
        schemes_ref = db.collection("schemes")
        
        # Firestore doesn't support easy full-text search or offset-based pagination natively without indices.
        # For Hackathon scale (small dataset), we will fetch all and filter in memory.
        docs = schemes_ref.stream()
        all_items = []
        for doc in docs:
            mapped_data = map_firestore_to_schema(doc)
            all_items.append(mapped_data)
            
        # Search Filter
        if search:
            search_lower = search.lower()
            all_items = [i for i in all_items if search_lower in i['name'].lower()]

        # Pagination
        total = len(all_items)
        start = skip
        end = skip + limit
        paginated_items = all_items[start:end]
        
        return {
            "total": total,
            "page": (skip // limit) + 1,
            "size": limit,
            "items": [SchemeResponse(**i) for i in paginated_items]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schemes/eligible", response_model=List[SchemeResponse])
def check_eligibility(user: UserProfile):
    try:
        db = get_firestore_db()
        schemes_ref = db.collection("schemes")
        docs = schemes_ref.stream()
        
        eligible_schemes = []
        for doc in docs:
            data = doc.to_dict()
            
            # --- Rule-Based Logic ---
            scheme_state = data.get("state", "All India")
            if scheme_state != "All India" and scheme_state != user.state:
                continue
                
            scheme_castes = data.get("eligibleCaste", ["All"])
            if "All" not in scheme_castes and user.caste not in scheme_castes:
                continue

            scheme_occupations = data.get("occupation", ["All"])
            if "All" not in scheme_occupations and user.occupation not in scheme_occupations:
                continue

            min_age = data.get("minAge", 0)
            max_age = data.get("maxAge", 100)
            if not (min_age <= user.age <= max_age):
                continue
                
            income_limit = data.get("incomeLimit", 0)
            if income_limit > 0 and user.income > income_limit:
                continue
            
            # Map to UI Schema
            mapped_data = map_firestore_to_schema(doc)
            eligible_schemes.append(SchemeResponse(**mapped_data))
            
        return eligible_schemes

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
