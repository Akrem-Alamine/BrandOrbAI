from PIL import Image
import streamlit as st

def show_avatar(talking=False):
    if talking:
        st.image("assets/avatar_talk.gif", width=200)
    else:
        st.image("assets/avatar_base.png", width=200)