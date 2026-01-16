from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class Caste(str, Enum):
    SC = "SC"
    ST = "ST"
    OBC = "OBC"
    GENERAL = "General"

class Occupation(str, Enum):
    STUDENT = "Student"
    FARMER = "Farmer"
    DAILY_WAGE_WORKER = "Daily Wage Worker"
    SALARIED = "Salaried"
    SELF_EMPLOYED = "Self Employed"
    UNEMPLOYED = "Unemployed"
    RETIRED = "Retired"

# Input Model (for Eligibility Check)
class UserProfile(BaseModel):
    age: int
    income: int
    caste: Caste
    occupation: Occupation
    occupation: Occupation
    state: str

class ChatRequest(BaseModel):
    message: str
    scheme_id: str
    language: str = "en"

# UI-Aligned Output Model
class SchemeResponse(BaseModel):
    id: str  # Firestore ID
    name: str = Field(alias="schemeName")
    ministry: str = "Government of India"  # Default/Placeholder
    description: str = "Government Scheme" # Placeholder
    eligibility: str  # Synthesized text
    benefits: str
    is_central: bool
    state_name: str = Field(alias="state")
    apply_link: str = Field(alias="applyLink") 

    class Config:
        allow_population_by_field_name = True

class PaginatedSchemes(BaseModel):
    total: int
    page: int = 1
    size: int = 10
    items: List[SchemeResponse]
