import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("Error: No API Key")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-flash-latest')

print("Sending test request to Gemini (2.0-flash)...")
try:
    response = model.generate_content("Hello")
    print("Response received:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
