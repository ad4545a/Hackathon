import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-flash-latest')
else:
    model = None
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

def generate_answer_from_llm(context: str, query: str):
    """
    Generates an answer using Google Gemini based on the provided scheme context.
    """
    print("CALLING OPEN LLM")
    
    if not model:
        return "I am currently unable to access my AI brain (Missing API Key). Please ask the developer to configure the GEMINI_API_KEY."

    # System Prompt (Strict instruction)
    system_instruction = "You are a government scheme assistant."

    # Construct the dynamic prompt as requested
    full_prompt = f"""
    {system_instruction}

    Scheme Context:
    {context}

    User Question:
    "{query}"

    Answer the user's question clearly and conversationally.
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
        return "I apologize, but I am facing some technical difficulties connecting to the AI service. Please check your internet connection or try again later."

def get_scheme_context(scheme_data: dict):
    """
    Formats scheme data into a clean text context for the LLM.
    """
    name = scheme_data.get('name') or scheme_data.get('schemeName') or 'Unknown Scheme'
    desc = scheme_data.get('description') or 'No description available'
    elig = scheme_data.get('eligibility') or 'Eligibility criteria not specified'
    ben = scheme_data.get('benefits') or 'Benefits not listed'
    
    # Add other potentially useful fields if available
    ministry = scheme_data.get('ministry') or 'Government of India'
    
    return f"""
    Scheme Name: {name}
    Scheme Summary: {desc}
    Eligibility: {elig}
    Benefits: {ben}
    """
