import numpy as np
import cv2
from pathlib import Path
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class FaceService:
    """
    Wraps InsightFace model for face detection + embedding.
    Model is loaded ONCE at startup — expensive operation.
    """

    def __init__(self):
        self.app = None
        self._load_model()

    def _load_model(self):
        """
        Load InsightFace ArcFace model.
        Falls back gracefully if package not installed (for dev without GPU).
        """
        try:
            from insightface.app import FaceAnalysis
            self.app = FaceAnalysis(
                name="buffalo_l",         # best accuracy model
                providers=["CPUExecutionProvider"],  # use GPU provider if available
            )
            self.app.prepare(ctx_id=0, det_size=(640, 640))
            logger.info("InsightFace model loaded successfully (buffalo_l)")
        except ImportError:
            logger.warning(
                "InsightFace not installed. Face matching will be unavailable. "
                "Install with: pip install insightface onnxruntime"
            )
        except Exception as e:
            logger.error(f"Failed to load InsightFace model: {e}")

    def _is_ready(self) -> bool:
        return self.app is not None

    def get_embedding_from_path(self, image_path: str) -> Optional[List[float]]:
        """
        Load image from disk, detect face, return 512D embedding.
        Returns None if no face detected or model unavailable.
        """
        if not self._is_ready():
            return None

        path = Path(image_path)
        if not path.exists():
            logger.error(f"Image not found: {image_path}")
            return None

        img = cv2.imread(str(path))
        if img is None:
            logger.error(f"Could not read image: {image_path}")
            return None

        return self._extract_embedding(img)

    def get_embedding_from_bytes(self, image_bytes: bytes) -> Optional[List[float]]:
        """
        Accept raw image bytes (from upload), return 512D embedding.
        """
        if not self._is_ready():
            return None

        arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            logger.error("Could not decode image bytes")
            return None

        return self._extract_embedding(img)

    def _extract_embedding(self, img: np.ndarray) -> Optional[List[float]]:
        """
        Core logic — runs InsightFace on BGR image, returns largest face embedding.
        Picks the largest face if multiple detected (most likely the subject).
        """
        try:
            faces = self.app.get(img)

            if not faces:
                logger.warning("No face detected in image")
                return None

            # Pick largest face by bounding box area
            largest = max(
                faces,
                key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])
            )

            embedding = largest.embedding
            # Normalize to unit vector for cosine similarity
            norm = np.linalg.norm(embedding)
            if norm == 0:
                return None
            normalized = (embedding / norm).tolist()

            logger.debug(f"Face embedding extracted: dim={len(normalized)}, faces_found={len(faces)}")
            return normalized

        except Exception as e:
            logger.error(f"Face extraction failed: {e}")
            return None

    def detect_faces_in_frame(self, image_bytes: bytes) -> List[dict]:
        """
        For CCTV batch processing — returns ALL faces found in a frame,
        each with their bounding box and embedding.
        """
        if not self._is_ready():
            return []

        arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return []

        try:
            faces = self.app.get(img)
            results = []
            for face in faces:
                embedding = face.embedding
                norm = np.linalg.norm(embedding)
                if norm == 0:
                    continue
                results.append({
                    "embedding": (embedding / norm).tolist(),
                    "bbox": face.bbox.tolist(),
                    "det_score": float(face.det_score),  # detection confidence
                })
            return results

        except Exception as e:
            logger.error(f"Batch face detection failed: {e}")
            return []


# Singleton — loaded at startup
face_service = FaceService()