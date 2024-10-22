from flask import Flask, request, jsonify, send_from_directory, render_template
from openai import OpenAI
import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import uuid
from pypinyin import pinyin, Style

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB limit

# Set OpenAI API key
OPEN_AI_API_KEY = os.getenv('OPEN_AI_API_KEY')
client = OpenAI(api_key=OPEN_AI_API_KEY)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)

        # Process the audio file
        try:
            transcription = transcribe_audio(file_path)
            formatted_translation = translate_and_format(transcription)
            return jsonify({
                'audio_url': f"/uploads/{unique_filename}",
                'formatted_translation': formatted_translation
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def transcribe_audio(file_path):
    """
    Transcribe audio using OpenAI's Whisper API.
    """
    with open(file_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file, 
                response_format="verbose_json",
                )
    transcription = response.text
    return transcription

def translate_and_format(text):
    """
    Translate Chinese text to English and format with pinyin using OpenAI's Chat Completion API.
    """
    prompt = f"""Translate the following into English. Provide the Chinese characters, pinyin, and English translation in the format shown below.

            Example format:

            中文：你好
            pinyin: nǐ hǎo
            English: hello

            Text to translate:
            {text}
            """

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Ensure you have access to GPT-4 or use another available model
        messages=[
            {"role": "system", "content": "You are a helpful assistant specializing in translations and language formatting."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,  # Lower temperature for more deterministic output
        max_tokens=1000  # Adjust as needed based on expected response length
    )

    translated_text = response.choices[0].message.content
    return translated_text

if __name__ == '__main__':
    app.run(debug=True)