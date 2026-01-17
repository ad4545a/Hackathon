import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-flash-latest') # Updated to match working test_gemini.py
else:
    model = None
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

def generate_answer_from_llm(context: str, query: str, history: list = []):
    """
    Generates an answer using Google Gemini based on the provided scheme context.
    """
    print("CALLING OPEN LLM")
    
    if not model:
        return "I am currently unable to access my AI brain (Missing API Key). Please ask the developer to configure the GEMINI_API_KEY."

    # 4️⃣ GEMINI SYSTEM PROMPT (MANDATORY)
    system_instruction = """You are a helpful Indian government scheme assistant.
You must answer naturally and conversationally.
Use the provided scheme data as the source of truth.
Explain eligibility, benefits, documents, and application steps clearly.
If exact details are missing, provide general guidance and suggest checking the official portal.
Never reply with pre-written or fixed text."""

    # Format History
    history_str = ""
    if history:
        history_str = "\nConversation History:\n"
        for msg in history[-5:]: # Keep last 5 turns
             role = "User" if msg.get('role') == 'user' else "Assistant"
             content = msg.get('content', '')
             history_str += f"{role}: {content}\n"

    # 5️⃣ DYNAMIC PROMPT BUILDING
    full_prompt = f"""
{system_instruction}

{context}
{history_str}
User Question:
"{query}"

Answer clearly and naturally.
"""

    print("USER MESSAGE:", query)
    print("PROMPT SENT TO GEMINI:", full_prompt)

    try:
        response = model.generate_content(full_prompt)
        print("RAW GEMINI RESPONSE:", response.text)
        
        if response.text:
            return response.text.strip()
        else:
            return "I'm sorry, I couldn't generate a response. Please try asking differently."

    except Exception as e:
        print(f"LLM GENERATION ERROR: {e}")
        # 7️⃣ FAILURE HANDLING - Polite message
        return "I apologize, but I am facing some technical difficulties connecting to the AI service. Please check your internet connection or try again later. You can also verify details on the official portal."

def get_scheme_context(scheme_data: dict):
    """
    Formats scheme data into a clean text context for the LLM.
    """
    name = scheme_data.get('name') or scheme_data.get('schemeName') or 'Unknown Scheme'
    # Use benefits as description if description is missing/placeholder
    desc = scheme_data.get('description')
    if not desc or desc == "Government Scheme": 
         desc = scheme_data.get('benefits', 'No description available')
         
    elig = scheme_data.get('eligibility') or 'Eligibility criteria not specified'
    ben = scheme_data.get('benefits') or 'Benefits not listed'
    docs = scheme_data.get('requiredDocuments') or 'Documents not specified'
    link = scheme_data.get('applyLink') or 'Not available'
    ministry = scheme_data.get('ministry') or 'Government of India'
    
    # 5️⃣ DYNAMIC PROMPT BUILDING - Context Part
    return f"""
Scheme Name: {name}
Scheme Summary: {desc}
Ministry: {ministry}
Eligibility: {elig}
Benefits: {ben}
Required Documents: {docs}
Apply Link: {link}
"""
