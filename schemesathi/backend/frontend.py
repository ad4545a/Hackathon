import streamlit as st
import requests

# Constants
API_URL = "http://127.0.0.1:8000/schemes/eligible"

# Enums (matching models.py)
CASTES = ["General", "SC", "ST", "OBC"]
OCCUPATIONS = ["Student", "Farmer", "Daily Wage Worker", "Salaried", "Self Employed", "Unemployed", "Retired"]
STATES = ["All India", "Madhya Pradesh", "Karnataka", "Maharashtra", "Other"]

st.set_page_config(page_title="SchemeSathi", page_icon="🇮🇳")

st.title("🇮🇳 AI-Based Government Scheme Assistant")
st.markdown("Find government schemes you are eligible for in seconds!")

# --- Sidebar: User Profile ---
st.sidebar.header("Your Profile")

age = st.sidebar.number_input("Age", min_value=0, max_value=120, value=25)
income = st.sidebar.number_input("Annual Income (₹)", min_value=0, value=100000, step=10000)
caste = st.sidebar.selectbox("Caste", CASTES)
occupation = st.sidebar.selectbox("Occupation", OCCUPATIONS)
state = st.sidebar.selectbox("State", STATES)

if st.sidebar.button("Check Eligibility"):
    # Payload
    payload = {
        "age": int(age),
        "income": int(income),
        "caste": caste,
        "occupation": occupation,
        "state": state
    }
    
    with st.spinner("Fetching eligible schemes..."):
        try:
            response = requests.post(API_URL, json=payload)
            
            if response.status_code == 200:
                schemes = response.json()
                
                if not schemes:
                    st.warning("No eligible schemes found for this profile. Try adjusting the inputs.")
                else:
                    st.success(f"Found {len(schemes)} eligible schemes!")
                    
                    for scheme in schemes:
                        with st.expander(f"📌 {scheme['name']}", expanded=True):
                            st.markdown(f"**Benefits:** {scheme['benefits']}")
                            st.markdown(f"**Eligibility Details:** {scheme['eligibility']}")
                            st.markdown(f"**Ministry:** {scheme['ministry']}")
                            st.markdown(f"[Apply Here]({scheme['apply_link']})")
                            
            else:
                st.error(f"Error fetching schemes. Status Code: {response.status_code}")
                st.write(response.text)
                
        except requests.exceptions.ConnectionError:
            st.error("Could not connect to Backend. Is `uvicorn main:app` running?")
        except Exception as e:
            st.error(f"An error occurred: {e}")

# --- Footer ---
st.markdown("---")
st.markdown("*Built for Hackathon | Powered by FastAPI & Firebase*")
