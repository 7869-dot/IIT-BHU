import google.generativeai as genai
import json
import logging
from typing import Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)

# Gemini embedding model — best for semantic similarity tasks
EMBEDDING_MODEL = "models/text-embedding-004"
GENERATION_MODEL = "gemini-1.5-flash"  # fast + free tier friendly

# Prompt that extracts structured fields from raw sighting text
EXTRACTION_PROMPT = """
You are an assistant helping police identify missing persons.
Analyze the following sighting report and extract structured information.

Report: {text}

Return ONLY a valid JSON object with these exact fields (no markdown, no extra text):
{{
  "person_description": "physical appearance details",
  "clothing": "clothing description if mentioned",
  "location": "specific place name or address",
  "city": "city or town name",
  "state": "state name",
  "landmark": "nearby landmark if mentioned",
  "timestamp_hint": "any time reference mentioned (e.g. 'this morning', '3pm')",
  "behavior": "any behavioral observations (e.g. confused, scared, running)",
  "companions": "any people with the person",
  "confidence_note": "how certain the reporter seems",
  "searchable_summary": "a single dense sentence combining all details for semantic search"
}}

If a field is not mentioned, use null. Always populate searchable_summary.
"""


class NLPService:
    """
    Wraps Gemini API for:
    1. Structured extraction from raw sighting text
    2. Semantic embeddings for similarity search
    """

    def __init__(self):
        self.model = None
        self.embed_model = EMBEDDING_MODEL
        self._initialize()

    def _initialize(self):
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(GENERATION_MODEL)
            logger.info(f"Gemini initialized — generation: {GENERATION_MODEL}, embedding: {EMBEDDING_MODEL}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")

    def _is_ready(self) -> bool:
        return self.model is not None

    # ------------------------------------------------------------------ #
    #  STRUCTURED EXTRACTION                                               #
    # ------------------------------------------------------------------ #

    def extract_sighting_fields(self, raw_text: str) -> Optional[dict]:
        """
        Takes a raw sighting report (typed by citizen or officer),
        returns structured JSON with location, description, behavior etc.
        """
        if not self._is_ready():
            logger.warning("Gemini not initialized, skipping extraction")
            return None

        prompt = EXTRACTION_PROMPT.format(text=raw_text)
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,       # low temp → consistent structured output
                    max_output_tokens=512,
                ),
            )
            raw = response.text.strip()

            # Strip markdown fences if model adds them
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            extracted = json.loads(raw)
            logger.debug(f"Extracted sighting fields: {list(extracted.keys())}")
            return extracted

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            return None
        except Exception as e:
            logger.error(f"Gemini extraction failed: {e}")
            return None

    def build_case_description(self, case_data: dict) -> str:
        """
        Converts a missing person case dict into a dense searchable string
        for embedding and storage in ChromaDB.
        """
        parts = [
            f"Missing person: {case_data.get('name', 'unknown')}",
            f"Age: {case_data.get('age', 'unknown')}",
            f"Gender: {case_data.get('gender', 'unknown')}",
            f"Physical description: {case_data.get('physical_description', '')}",
            f"Last seen wearing: {case_data.get('last_seen_clothing', '')}",
            f"Last known location: {case_data.get('last_seen_location', '')}",
            f"Additional notes: {case_data.get('additional_notes', '')}",
        ]
        return " | ".join(p for p in parts if p.split(": ", 1)[1])

    # ------------------------------------------------------------------ #
    #  EMBEDDINGS                                                          #
    # ------------------------------------------------------------------ #

    def get_embedding(self, text: str) -> Optional[List[float]]:
        """
        Returns a 768D semantic embedding for any text.
        Used for both case descriptions and sighting summaries.
        """
        if not text or not text.strip():
            return None

        try:
            result = genai.embed_content(
                model=self.embed_model,
                content=text,
                task_type="RETRIEVAL_DOCUMENT",
            )
            embedding = result["embedding"]
            logger.debug(f"Generated embedding: dim={len(embedding)}")
            return embedding

        except Exception as e:
            logger.error(f"Gemini embedding failed: {e}")
            return None

    def get_query_embedding(self, text: str) -> Optional[List[float]]:
        """
        Embedding for a QUERY (sighting text searching against stored cases).
        Uses RETRIEVAL_QUERY task type — slightly different from document embedding.
        """
        if not text or not text.strip():
            return None

        try:
            result = genai.embed_content(
                model=self.embed_model,
                content=text,
                task_type="RETRIEVAL_QUERY",
            )
            return result["embedding"]

        except Exception as e:
            logger.error(f"Gemini query embedding failed: {e}")
            return None

    def translate_to_english(self, text: str) -> str:
        """
        Translates Hindi / regional language text to English.
        Allows citizen tips in any language to flow through the pipeline.
        """
        if not self._is_ready():
            return text

        try:
            prompt = (
                f"Translate the following text to English. "
                f"If already in English, return it unchanged. "
                f"Return ONLY the translation, nothing else.\n\n{text}"
            )
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(temperature=0.0),
            )
            return response.text.strip()

        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return text  # fall back to original


# Singleton
nlp_service = NLPService()