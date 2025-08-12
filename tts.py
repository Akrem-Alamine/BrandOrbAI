import pyttsx3
import tempfile
import os

def text_to_speech(text):
    """Convertit le texte en parole et retourne le fichier audio"""
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')
    engine.setProperty('voice', voices[0].id)
    engine.setProperty('rate', 150)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as fp:
        temp_path = fp.name
    engine.save_to_file(text, temp_path)
    engine.runAndWait()
    return temp_path