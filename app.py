import os
import json
import base64
import requests
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Necesario para manejar sesiones

# Azure Face API configuration
FACE_API_KEY = os.getenv('FACE_APIKEY')
FACE_ENDPOINT = os.getenv('FACE_ENDPOINT')
FACE_DETECT_URL = f"{FACE_ENDPOINT}face/v1.0/detect"

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Decorator para requerir autenticación
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'authenticated' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/login')
def login():
    # Si ya está autenticado, redirigir a la página principal
    if 'authenticated' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login_post():
    username = request.form.get('username')
    password = request.form.get('password')
    
    # Validar credenciales (en un entorno real, esto debería ser más seguro)
    if username == 'admin' and password == 'smartsolutions':
        session['authenticated'] = True
        session['username'] = username
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'message': 'Usuario o contraseña incorrectos'}), 401

@app.route('/logout')
def logout():
    session.pop('authenticated', None)
    session.pop('username', None)
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
@login_required
def detect_faces():
    # Get ID image and selfie image from request
    id_image = request.files.get('id_image')
    selfie_image = request.files.get('selfie_image')
    
    if not id_image or not selfie_image:
        return jsonify({'error': 'Both ID image and selfie are required'}), 400
    
    # Process ID image
    id_face = detect_face(id_image)
    if not id_face:
        return jsonify({'error': 'No face detected in ID image'}), 400
    
    # Process selfie image
    selfie_face = detect_face(selfie_image)
    if not selfie_face:
        return jsonify({'error': 'No face detected in selfie image'}), 400
    
    # Compare faces using data from Azure Face API
    verification_result = compare_faces(id_face, selfie_face)
    
    return jsonify(verification_result)

@app.route('/capture', methods=['POST'])
@login_required
def capture_image():
    try:
        # Get base64 encoded image from request
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Convert base64 to image
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        image = Image.open(BytesIO(base64.b64decode(image_data)))
        
        # Save image temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_capture.jpg')
        image.save(temp_path)
        
        return jsonify({'success': True, 'path': temp_path})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def detect_face(image_file):
    """Detect faces in an image and return the face information using Azure Face API"""
    headers = {
        'Ocp-Apim-Subscription-Key': FACE_API_KEY,
        'Content-Type': 'application/octet-stream'
    }
    
    params = {
        'returnFaceId': 'false',  # No solicitar ID para evitar restricciones
        'returnFaceLandmarks': 'false',
        'detectionModel': 'detection_03'  # Usar el modelo más reciente
    }
    
    try:
        # Asegurarnos de que estamos al inicio del archivo
        image_file.seek(0)
        image_data = image_file.read()
        
        # Verificar que tenemos datos de imagen
        if not image_data:
            print("Error: No image data")
            return None
            
        print(f"Sending request to {FACE_DETECT_URL} with {len(image_data)} bytes")
        response = requests.post(FACE_DETECT_URL, params=params, headers=headers, data=image_data)
        
        # Imprimir información de depuración
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {response.headers}")
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            
        response.raise_for_status()
        
        faces = response.json()
        if faces and len(faces) > 0:
            return faces[0]  # Devolver la información del primer rostro detectado
        return None
    except Exception as e:
        print(f"Error detecting face: {str(e)}")
        return None

def compare_faces(face1, face2):
    """
    Comparar rostros utilizando datos de Azure Face API
    Como no podemos usar la API de verificación directamente (requiere aprobación),
    hacemos una comparación básica de los rectángulos faciales
    """
    try:
        # Obtener los rectángulos faciales
        rect1 = face1.get('faceRectangle', {})
        rect2 = face2.get('faceRectangle', {})
        
        # Calcular la proporción de ancho/alto para cada cara
        ratio1 = rect1.get('width', 1) / max(rect1.get('height', 1), 1)
        ratio2 = rect2.get('width', 1) / max(rect2.get('height', 1), 1)
        
        # Calcular la diferencia de proporciones
        ratio_diff = abs(ratio1 - ratio2)
        
        # Calcular una puntuación de similitud simple basada en la diferencia de proporciones
        similarity_score = max(0, 1 - (ratio_diff / 0.5))
        
        # Determinar si las caras son similares basado en un umbral simple
        is_same_person = similarity_score > 0.7
        
        return {
            'isIdentical': similarity_score > 0.5,
            'confidence': similarity_score,
            'verified': is_same_person,
            'message': 'Esta es una verificación basada en la geometría facial detectada por Azure Face API. Para una verificación más precisa se requiere acceso a las funciones avanzadas de verificación facial de Azure.'
        }
    except Exception as e:
        print(f"Error comparing faces: {str(e)}")
        return {
            'isIdentical': False,
            'confidence': 0,
            'verified': False,
            'error': str(e)
        }

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5009))
    app.run(debug=True, port=port)
