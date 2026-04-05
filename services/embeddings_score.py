import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class EmbeddingStore:
    """
    Manages ChromaDB client and both collections.
    Initialized once at startup, shared across all services.
    """

    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.face_collection = self._get_or_create(settings.FACE_COLLECTION)
        self.text_collection = self._get_or_create(settings.TEXT_COLLECTION)
        logger.info("ChromaDB initialized — collections: face_embeddings, text_embeddings")

    def _get_or_create(self, name: str):
        """Gets existing collection or creates it — safe to call on every startup."""
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},   # cosine similarity for face + text
        )

    # ------------------------------------------------------------------ #
    #  FACE COLLECTION                                                     #
    # ------------------------------------------------------------------ #

    def store_face(
        self,
        embedding: List[float],
        case_id: int,
        photo_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Store a face embedding for a reference case photo."""
        doc_id = f"face_{case_id}_{photo_id}"
        meta = {
            "case_id": str(case_id),
            "photo_id": photo_id,
            "type": "reference",
            **(metadata or {}),
        }
        self.face_collection.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            metadatas=[meta],
        )
        logger.debug(f"Stored face embedding: {doc_id}")

    def query_faces(
        self,
        embedding: List[float],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Query face collection with a new face embedding.
        Returns list of {case_id, score, metadata} dicts.
        """
        results = self.face_collection.query(
            query_embeddings=[embedding],
            n_results=min(top_k, self.face_collection.count() or 1),
            include=["metadatas", "distances"],
        )

        matches = []
        if results["ids"] and results["ids"][0]:
            for meta, dist in zip(results["metadatas"][0], results["distances"][0]):
                matches.append({
                    "case_id": int(meta["case_id"]),
                    "score": round(1 - dist, 4),   # cosine distance → similarity
                    "metadata": meta,
                })
        return matches

    # ------------------------------------------------------------------ #
    #  TEXT COLLECTION                                                     #
    # ------------------------------------------------------------------ #

    def store_text(
        self,
        embedding: List[float],
        case_id: int,
        doc_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Store a text/description embedding for a case profile."""
        full_id = f"text_{case_id}_{doc_id}"
        meta = {
            "case_id": str(case_id),
            "doc_id": doc_id,
            "type": "case_description",
            **(metadata or {}),
        }
        self.text_collection.upsert(
            ids=[full_id],
            embeddings=[embedding],
            metadatas=[meta],
        )
        logger.debug(f"Stored text embedding: {full_id}")

    def query_texts(
        self,
        embedding: List[float],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Query text collection with a sighting description embedding.
        Returns list of {case_id, score, metadata} dicts.
        """
        results = self.text_collection.query(
            query_embeddings=[embedding],
            n_results=min(top_k, self.text_collection.count() or 1),
            include=["metadatas", "distances"],
        )

        matches = []
        if results["ids"] and results["ids"][0]:
            for meta, dist in zip(results["metadatas"][0], results["distances"][0]):
                matches.append({
                    "case_id": int(meta["case_id"]),
                    "score": round(1 - dist, 4),
                    "metadata": meta,
                })
        return matches

    # ------------------------------------------------------------------ #
    #  UTILS                                                               #
    # ------------------------------------------------------------------ #

    def delete_case_embeddings(self, case_id: int) -> None:
        """Remove all embeddings for a case (e.g. case closed/deleted)."""
        prefix = str(case_id)
        for collection in [self.face_collection, self.text_collection]:
            existing = collection.get(where={"case_id": prefix})
            if existing["ids"]:
                collection.delete(ids=existing["ids"])
        logger.info(f"Deleted all embeddings for case {case_id}")


# Singleton — imported by face_service and nlp_service
embedding_store = EmbeddingStore()