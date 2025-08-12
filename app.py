import streamlit as st
from llm_api import ask_llm
from tts import text_to_speech
from avatar import show_avatar
import time
import os
import base64
from io import BytesIO

# Configuration de la page
st.set_page_config(layout="centered")

st.title("🤖 Avatar IA qui parle")

# Initialisation des états
if 'processing' not in st.session_state:
    st.session_state.processing = False
if 'audio_played' not in st.session_state:
    st.session_state.audio_played = False

# Zone de question
question = st.text_input("Posez votre question à l'avatar :")

if st.button("Envoyer") and question:
    # Début du traitement
    st.session_state.processing = True
    st.session_state.audio_played = False
    
    # Afficher l'avatar qui parle immédiatement
    avatar_placeholder = st.empty()
    avatar_placeholder.image("assets/avatar_talk.gif", width=300)
    
    # Récupérer la réponse
    with st.spinner("L'avatar réfléchit..."):
        response = ask_llm(question)
    
    # Afficher la réponse
    st.markdown(f"**Réponse :** {response}")
    
    # Générer la voix
    with st.spinner("Préparation de la réponse audio..."):
        audio_file = text_to_speech(response)
    
    # Lire le fichier audio
    with open(audio_file, "rb") as f:
        audio_bytes = f.read()
    
    # Créer le lecteur audio autoplay
    audio_str = base64.b64encode(audio_bytes).decode()
    audio_html = f"""
    <audio autoplay onplay="console.log('Audio started')">
        <source src="data:audio/wav;base64,{audio_str}" type="audio/wav">
    </audio>
    """
    st.components.v1.html(audio_html, height=0)
    
    # Afficher le contrôle audio optionnel
    st.audio(audio_bytes, format="audio/wav")
    
    # Marquer l'audio comme joué
    st.session_state.audio_played = True
    
    # Attendre que l'audio soit chargé (petit délai)
    time.sleep(0.5)
    
    # Maintenir l'animation pendant la durée estimée
    estimated_duration = len(response.split()) * 0.3  # ~0.3s par mot
    time.sleep(min(estimated_duration, 10))  # Max 10s
    
    # Fin de l'animation
    st.session_state.processing = False
    avatar_placeholder.image("assets/avatar_base.png", width=300)
    
    # Nettoyage
    try:
        os.unlink(audio_file)
    except:
        pass
else:
    # État initial - avatar au repos
    show_avatar(talking=False)

# Affichage conditionnel pendant le traitement
if st.session_state.get('processing', False):
    st.info("L'avatar est en train de répondre...")