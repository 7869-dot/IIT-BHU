import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import cv2
import numpy as np
from deepface import DeepFace
from pathlib import Path
from dotenv import load_dotenv
import traceback
import os

import google.generativeai as genai

load_dotenv()

ALERT_THRESHOLD = float(os.getenv("ALERT_THRESHOLD", 60.0))
MODEL_NAME      = os.getenv("MODEL_NAME", "VGG-Face")
DETECTOR        = os.getenv("DETECTOR", "opencv")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def match_faces(reference_path: str, sighting_path: str) -> dict:
    """
    Compare reference photo against a sighting image.
    Returns:
        confidence     : float  (0-100, higher = more likely same person)
        is_alert       : bool
        annotated_path : str    (path to image with bounding box drawn)
        face_found     : bool   (was a face detected in sighting image at all?)
    """
    try:
        # ── Step 1: Detect face(s) in sighting image ─────────────────────────
        face_objs = DeepFace.extract_faces(
            img_path          = sighting_path,
            detector_backend  = DETECTOR,
            enforce_detection = False
        )

        face_found = len(face_objs) > 0 and face_objs[0]["confidence"] > 0.5

        # ── Step 2: Run verification ──────────────────────────────────────────
        result = DeepFace.verify(
            img1_path         = reference_path,
            img2_path         = sighting_path,
            model_name        = MODEL_NAME,
            detector_backend  = DETECTOR,
            enforce_detection = False
        )

        distance  = result.get("distance", 1.0)
        threshold = result.get("threshold", 0.4)

        # Convert distance → confidence score (0-100)
        # distance=0 means identical, distance>=threshold means no match
        confidence = max(0.0, (1.0 - distance / threshold) * 100)
        confidence = round(min(confidence, 100.0), 2)

        # ── Step 3: Draw bounding box on sighting image ───────────────────────
        annotated_path = _draw_bounding_box(
            sighting_path = sighting_path,
            face_objs     = face_objs,
            confidence    = confidence,
            face_found    = face_found
        )

        return {
            "confidence"     : confidence,
            "is_alert"       : confidence >= ALERT_THRESHOLD,
            "annotated_path" : annotated_path,
            "face_found"     : face_found,
        }

    except Exception as e:
        traceback.print_exc()
        return {
            "confidence"     : 0.0,
            "is_alert"       : False,
            "annotated_path" : sighting_path,
            "face_found"     : False,
        }


def _draw_bounding_box(
    sighting_path: str,
    face_objs: list,
    confidence: float,
    face_found: bool
) -> str:
    """
    Draw a coloured bounding box + confidence label on the sighting image.
    Green  = high confidence (alert)
    Amber  = medium confidence
    Red    = low / no match
    Returns the path of the annotated image.
    """
    img = cv2.imread(sighting_path)
    if img is None:
        return sighting_path

    if confidence >= ALERT_THRESHOLD:
        colour = (0, 255, 0)
        label  = f"MATCH  {confidence:.1f}%"
    elif confidence >= 30:
        colour = (0, 200, 255)
        label  = f"POSSIBLE  {confidence:.1f}%"
    else:
        colour = (0, 0, 255)
        label  = f"NO MATCH  {confidence:.1f}%"

    if face_found and face_objs:
        for face_obj in face_objs:
            region = face_obj.get("facial_area", {})
            x  = region.get("x", 0)
            y  = region.get("y", 0)
            fw = region.get("w", 80)
            fh = region.get("h", 80)

            cv2.rectangle(img, (x, y), (x + fw, y + fh), colour, 3)

            (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            cv2.rectangle(img, (x, y - lh - 12), (x + lw + 8, y), colour, -1)

            cv2.putText(
                img, label,
                (x + 4, y - 6),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7, (0, 0, 0), 2
            )
    else:
        cv2.putText(
            img, "No face detected",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9, (0, 0, 255), 2
        )

    p = Path(sighting_path)
    annotated_path = str(p.parent / f"annotated_{p.name}").replace("\\", "/")
    cv2.imwrite(annotated_path, img)
    return annotated_path


def generate_intelligence_report(
    confidence  : float,
    location    : str,
    timestamp   : str,
    notes       : str,
    victim_name : str,
    victim_age  : int,
    face_found  : bool
) -> str:
    """
    Use Gemini to generate a human-readable intelligence report
    for law enforcement based on the sighting data.
    """
    prompt = f"""
You are an AI assistant helping Indian law enforcement track missing persons.

A sighting report has been submitted. Based on the following data, write a short 
intelligence report (3-5 sentences) that a police officer would find actionable.
Be factual, concise, and professional.

Sighting Data:
- Missing Person: {victim_name}, Age {victim_age}
- Location reported: {location}
- Time of sighting: {timestamp}
- Face detected in image: {face_found}
- AI face match confidence: {confidence:.1f}%
- Reporter notes: {notes or 'None provided'}

Write the intelligence report now:
"""
    try:
        model    = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"LLM report unavailable: {str(e)}"