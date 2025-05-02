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
    try:
        # Get ID image and selfie image from request
        id_image = request.files.get('id_image')
        selfie_image = request.files.get('selfie_image')
        
        print(f"Received request with id_image: {id_image.filename if id_image else None}")
        print(f"Received request with selfie_image: {selfie_image.filename if selfie_image else None}")
        
        if not id_image or not selfie_image:
            error_msg = 'Both ID image and selfie are required'
            print(error_msg)
            return jsonify({'error': error_msg}), 400
        
        # Verificar el contenido de las imágenes
        id_image.seek(0)
        id_data = id_image.read()
        id_image.seek(0)  # Rebobinar para uso posterior
        
        selfie_image.seek(0)
        selfie_data = selfie_image.read()
        selfie_image.seek(0)  # Rebobinar para uso posterior
        
        print(f"ID image size: {len(id_data)} bytes")
        print(f"Selfie image size: {len(selfie_data)} bytes")
        
        if len(id_data) == 0:
            error_msg = 'ID image is empty'
            print(error_msg)
            return jsonify({'error': error_msg}), 400
            
        if len(selfie_data) == 0:
            error_msg = 'Selfie image is empty'
            print(error_msg)
            return jsonify({'error': error_msg}), 400
        
        # Process ID image
        print("Attempting to detect face in ID image...")
        id_face = detect_face(id_image)
        if not id_face:
            print("No face detected in ID image with standard parameters")
            # Intentar con parámetros más permisivos para la imagen de ID
            print("Attempting with more permissive parameters...")
            id_face = detect_face_permissive(id_image)
            if not id_face:
                error_msg = 'No face detected in ID image'
                print(error_msg)
                return jsonify({'error': error_msg}), 400
            print("Face detected in ID image with permissive parameters")
        else:
            print("Face detected in ID image with standard parameters")
        
        # Process selfie image
        print("Attempting to detect face in selfie image...")
        selfie_face = detect_face(selfie_image)
        if not selfie_face:
            print("No face detected in selfie image with standard parameters")
            # Intentar con parámetros más permisivos para la selfie
            print("Attempting with more permissive parameters...")
            selfie_face = detect_face_permissive(selfie_image)
            if not selfie_face:
                error_msg = 'No face detected in selfie image'
                print(error_msg)
                return jsonify({'error': error_msg}), 400
            print("Face detected in selfie image with permissive parameters")
        else:
            print("Face detected in selfie image with standard parameters")
        
        # Compare faces using data from Azure Face API
        print("Comparing faces...")
        verification_result = compare_faces(id_face, selfie_face)
        print(f"Verification result: {verification_result}")
        
        return jsonify(verification_result)
    except Exception as e:
        error_msg = f"Error in face detection process: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return jsonify({'error': error_msg}), 500

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
    
    # Solicitar solo atributos básicos que no requieren aprobación especial
    params = {
        'returnFaceId': 'false',  # No solicitar ID para evitar restricciones
        'returnFaceLandmarks': 'true',  # Solicitar landmarks para mejor comparación
        'detectionModel': 'detection_03',  # Modelo más preciso
        'returnFaceAttributes': 'headPose'  # Solo atributos básicos
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
        print(f"Detected {len(faces)} faces")
        if faces and len(faces) > 0:
            print(f"Face details: {faces[0]}")
            return faces[0]  # Devolver la información del primer rostro detectado
        return None
    except Exception as e:
        print(f"Error detecting face: {str(e)}")
        return None

def detect_face_permissive(image_file):
    """Detect faces in an image and return the face information using Azure Face API with more permissive parameters"""
    headers = {
        'Ocp-Apim-Subscription-Key': FACE_API_KEY,
        'Content-Type': 'application/octet-stream'
    }
    
    # Solicitar solo atributos básicos que no requieren aprobación especial
    params = {
        'returnFaceId': 'false',  # No solicitar ID para evitar restricciones
        'returnFaceLandmarks': 'true',  # Solicitar landmarks para mejor comparación
        'detectionModel': 'detection_02',  # Modelo menos preciso pero más permisivo
        'returnFaceAttributes': 'headPose'  # Solo atributos básicos
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
        print(f"Detected {len(faces)} faces")
        if faces and len(faces) > 0:
            print(f"Face details: {faces[0]}")
            return faces[0]  # Devolver la información del primer rostro detectado
        return None
    except Exception as e:
        print(f"Error detecting face: {str(e)}")
        return None

def compare_faces(face1, face2):
    """
    Comparar rostros utilizando datos de Azure Face API
    Implementamos una comparación más avanzada utilizando landmarks faciales y otros atributos
    """
    try:
        # Verificar si tenemos landmarks faciales para una comparación más precisa
        if 'faceLandmarks' in face1 and 'faceLandmarks' in face2:
            landmarks1 = face1.get('faceLandmarks', {})
            landmarks2 = face2.get('faceLandmarks', {})
            
            # Calcular similitud basada en landmarks faciales
            if landmarks1 and landmarks2:
                # 1. Calcular distancia entre puntos clave (ojos, nariz, boca)
                key_points1 = [
                    (landmarks1.get('pupilLeft', {}).get('x', 0), landmarks1.get('pupilLeft', {}).get('y', 0)),
                    (landmarks1.get('pupilRight', {}).get('x', 0), landmarks1.get('pupilRight', {}).get('y', 0)),
                    (landmarks1.get('noseTip', {}).get('x', 0), landmarks1.get('noseTip', {}).get('y', 0)),
                    (landmarks1.get('mouthLeft', {}).get('x', 0), landmarks1.get('mouthLeft', {}).get('y', 0)),
                    (landmarks1.get('mouthRight', {}).get('x', 0), landmarks1.get('mouthRight', {}).get('y', 0)),
                    (landmarks1.get('eyebrowLeftOuter', {}).get('x', 0), landmarks1.get('eyebrowLeftOuter', {}).get('y', 0)),
                    (landmarks1.get('eyebrowRightOuter', {}).get('x', 0), landmarks1.get('eyebrowRightOuter', {}).get('y', 0)),
                    (landmarks1.get('upperLipTop', {}).get('x', 0), landmarks1.get('upperLipTop', {}).get('y', 0)),
                    (landmarks1.get('underLipBottom', {}).get('x', 0), landmarks1.get('underLipBottom', {}).get('y', 0))
                ]
                
                key_points2 = [
                    (landmarks2.get('pupilLeft', {}).get('x', 0), landmarks2.get('pupilLeft', {}).get('y', 0)),
                    (landmarks2.get('pupilRight', {}).get('x', 0), landmarks2.get('pupilRight', {}).get('y', 0)),
                    (landmarks2.get('noseTip', {}).get('x', 0), landmarks2.get('noseTip', {}).get('y', 0)),
                    (landmarks2.get('mouthLeft', {}).get('x', 0), landmarks2.get('mouthLeft', {}).get('y', 0)),
                    (landmarks2.get('mouthRight', {}).get('x', 0), landmarks2.get('mouthRight', {}).get('y', 0)),
                    (landmarks2.get('eyebrowLeftOuter', {}).get('x', 0), landmarks2.get('eyebrowLeftOuter', {}).get('y', 0)),
                    (landmarks2.get('eyebrowRightOuter', {}).get('x', 0), landmarks2.get('eyebrowRightOuter', {}).get('y', 0)),
                    (landmarks2.get('upperLipTop', {}).get('x', 0), landmarks2.get('upperLipTop', {}).get('y', 0)),
                    (landmarks2.get('underLipBottom', {}).get('x', 0), landmarks2.get('underLipBottom', {}).get('y', 0))
                ]
                
                # 2. Normalizar las coordenadas para que sean independientes del tamaño de la imagen
                # Calcular el centro de la cara y la escala para cada conjunto de puntos
                def normalize_points(points):
                    # Encontrar el centro
                    x_coords = [p[0] for p in points]
                    y_coords = [p[1] for p in points]
                    center_x = sum(x_coords) / len(x_coords)
                    center_y = sum(y_coords) / len(y_coords)
                    
                    # Calcular la escala (distancia promedio desde el centro)
                    distances = [((p[0] - center_x)**2 + (p[1] - center_y)**2)**0.5 for p in points]
                    scale = sum(distances) / len(distances)
                    
                    # Normalizar los puntos
                    return [((p[0] - center_x) / scale, (p[1] - center_y) / scale) for p in points]
                
                norm_points1 = normalize_points(key_points1)
                norm_points2 = normalize_points(key_points2)
                
                # 3. Calcular la similitud como la distancia euclidiana promedio entre puntos correspondientes
                distances = [((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)**0.5 for p1, p2 in zip(norm_points1, norm_points2)]
                avg_distance = sum(distances) / len(distances)
                
                # Convertir distancia a similitud (menor distancia = mayor similitud)
                # Aplicar una función exponencial para penalizar más las diferencias
                landmark_similarity = max(0, 1 - (avg_distance * 2))
                
                # Verificar la orientación de la cabeza si está disponible
                head_pose_similarity = 1.0
                if 'faceAttributes' in face1 and 'faceAttributes' in face2:
                    headPose1 = face1.get('faceAttributes', {}).get('headPose', {})
                    headPose2 = face2.get('faceAttributes', {}).get('headPose', {})
                    
                    if headPose1 and headPose2:
                        # Calcular la diferencia en la orientación de la cabeza
                        yaw_diff = abs(headPose1.get('yaw', 0) - headPose2.get('yaw', 0))
                        pitch_diff = abs(headPose1.get('pitch', 0) - headPose2.get('pitch', 0))
                        roll_diff = abs(headPose1.get('roll', 0) - headPose2.get('roll', 0))
                        
                        # Penalizar si hay diferencias grandes en la orientación
                        head_pose_similarity = max(0, 1 - (yaw_diff + pitch_diff + roll_diff) / 60)
                
                # Calcular la similitud final
                similarity_score = landmark_similarity * 0.8 + head_pose_similarity * 0.2
                
                # Aplicar umbrales mucho más estrictos
                is_same_person = similarity_score > 0.85  # Aumentado de 0.7 a 0.85
                verified = similarity_score > 0.92  # Aumentado de 0.8 a 0.92
                
                print(f"Face comparison details (landmark-based):")
                print(f"- Landmark similarity: {landmark_similarity:.4f}")
                print(f"- Head pose similarity: {head_pose_similarity:.4f}")
                print(f"- Overall similarity score: {similarity_score:.4f}")
                print(f"- Is same person: {is_same_person}")
                print(f"- Verified: {verified}")
                
                return {
                    'isIdentical': is_same_person,
                    'confidence': similarity_score,
                    'verified': verified,
                    'message': 'Esta es una verificación basada en landmarks faciales detectados por Azure Face API. Para una verificación más precisa se requiere acceso a las funciones avanzadas de verificación facial de Azure.'
                }
        
        # Si no tenemos landmarks, caemos en el método de rectángulos faciales
        # Obtener los rectángulos faciales
        rect1 = face1.get('faceRectangle', {})
        rect2 = face2.get('faceRectangle', {})
        
        # Calcular la proporción de ancho/alto para cada cara
        ratio1 = rect1.get('width', 1) / max(rect1.get('height', 1), 1)
        ratio2 = rect2.get('width', 1) / max(rect2.get('height', 1), 1)
        
        # Calcular la diferencia de proporciones (más estricta)
        ratio_diff = abs(ratio1 - ratio2)
        
        # Calcular puntuación de similitud basada en múltiples factores
        # 1. Similitud de proporción facial (más estricta)
        proportion_similarity = max(0, 1 - (ratio_diff * 3))  # Más sensible a diferencias
        
        # 2. Diferencia en el tamaño relativo de los rostros
        size1 = rect1.get('width', 1) * rect1.get('height', 1)
        size2 = rect2.get('width', 1) * rect2.get('height', 1)
        size_ratio = min(size1, size2) / max(size1, size2)
        size_similarity = size_ratio  # Penaliza diferencias grandes de tamaño
        
        # Combinar factores con diferentes pesos
        # Damos más importancia a la proporción facial
        similarity_score = (proportion_similarity * 0.7) + (size_similarity * 0.3)
        
        # Aplicar umbrales más estrictos
        is_same_person = similarity_score > 0.85  # Aumentado de 0.75 a 0.85
        verified = similarity_score > 0.92  # Aumentado de 0.82 a 0.92
        
        print(f"Face comparison details (rectangle-based):")
        print(f"- Proportion similarity: {proportion_similarity:.4f}")
        print(f"- Size similarity: {size_similarity:.4f}")
        print(f"- Overall similarity score: {similarity_score:.4f}")
        print(f"- Is same person: {is_same_person}")
        print(f"- Verified: {verified}")
        
        return {
            'isIdentical': is_same_person,
            'confidence': similarity_score,
            'verified': verified,
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
