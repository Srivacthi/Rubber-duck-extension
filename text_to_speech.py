from gtts import gTTS
import os
import speech_recognition as sr
import requests
import json

def text_to_speech(text):
    tts = gTTS(text=text, lang="en")
    tts.save("output3.mp3")
    os.system("start output3.mp3")

def speech_to_text(): #returns your question to text
    r = sr.Recognizer()

    with sr.Microphone(device_index=1) as source:
        print("Listening...")
        # reducing background noice
        r.adjust_for_ambient_noise(source)
        audio = r.listen(source)

    try:
        text = r.recognize_google(audio)  # Convert speech to text
        print("You said:", text)
        return text
    except sr.UnknownValueError:
        print("Sorry, could not understand the audio.")
    except sr.RequestError:
        print("Could not connect to the Google API. Check your internet connection.")

def ask_gemini(prompt):
    GEMINI_API_KEY = "AIzaSyD6auRHH1vSuds0MCtvfvbsJ-rocubWfQs"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        ai_response = response.json()
        generated_text = ai_response["candidates"][0]["content"]["parts"][0]["text"]
        print("AI Response:", generated_text)
        return generated_text
    else:
        print("API Request Failed:", response.status_code, response.text)

question=speech_to_text()
system_prompt = '''You are a helpful AI assistant who is really good at coding and walks the user through any problem.
You will provide hints and context in the right direction instead of the full answer.
After the user reaches the answer, you will confirm the answer. The following is the user question:'''
prompt = system_prompt + question
generated_text = ask_gemini(prompt)
text_to_speech(generated_text)