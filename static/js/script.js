document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const idUpload = document.getElementById('id-upload');
    const idPreview = document.getElementById('id-image-preview');
    const selfieUpload = document.getElementById('selfie-upload');
    const selfiePreview = document.getElementById('selfie-image-preview');
    const cameraBtn = document.getElementById('camera-btn');
    const cameraContainer = document.getElementById('camera-container');
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('capture-btn');
    const cancelCameraBtn = document.getElementById('cancel-camera-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const resultContainer = document.getElementById('result-container');
    const resultAlert = document.getElementById('result-alert');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const confidenceScore = document.getElementById('confidence-score');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Variables para almacenar imágenes
    let idImageFile = null;
    let selfieImageFile = null;
    let stream = null;
    
    // Agregar efectos de arrastrar y soltar para las imágenes
    setupDragAndDrop('id-preview', handleIdImage);
    setupDragAndDrop('selfie-preview', handleSelfieImage);
    
    // Event listeners para cargas de archivos
    idUpload.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleIdImage(e.target.files[0]);
        }
    });
    
    selfieUpload.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleSelfieImage(e.target.files[0]);
        }
    });
    
    // Funcionalidad de la cámara
    cameraBtn.addEventListener('click', startCamera);
    captureBtn.addEventListener('click', capturePhoto);
    cancelCameraBtn.addEventListener('click', stopCamera);
    
    // Botón de verificación
    verifyBtn.addEventListener('click', verifyIdentity);
    
    // Función para configurar arrastrar y soltar
    function setupDragAndDrop(elementId, handleFile) {
        const dropZone = document.getElementById(elementId);
        
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }
    
    // Función para manejar la imagen de ID
    function handleIdImage(file) {
        if (isValidImageFile(file)) {
            idImageFile = file;
            previewImage(file, idPreview);
            checkVerifyButton();
            
            // Animación de éxito
            animateSuccess('id-preview');
        } else {
            showToast('Por favor, seleccione un archivo de imagen válido (JPG, PNG, GIF).');
        }
    }
    
    // Función para manejar la imagen de selfie
    function handleSelfieImage(file) {
        if (isValidImageFile(file)) {
            selfieImageFile = file;
            previewImage(file, selfiePreview);
            checkVerifyButton();
            
            // Animación de éxito
            animateSuccess('selfie-preview');
        } else {
            showToast('Por favor, seleccione un archivo de imagen válido (JPG, PNG, GIF).');
        }
    }
    
    // Función para validar tipos de archivo de imagen
    function isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        return validTypes.includes(file.type);
    }
    
    // Función para mostrar una notificación
    function showToast(message) {
        // Crear elemento de toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        
        // Agregar al DOM
        document.body.appendChild(toast);
        
        // Mostrar con animación
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Función para animar el éxito de carga
    function animateSuccess(elementId) {
        const element = document.getElementById(elementId);
        element.classList.add('success-animation');
        setTimeout(() => {
            element.classList.remove('success-animation');
        }, 700);
    }
    
    // Función para previsualizar imágenes cargadas
    function previewImage(file, previewElement) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.src = e.target.result;
            previewElement.classList.add('loaded');
        };
        reader.readAsDataURL(file);
    }
    
    // Función para iniciar la cámara
    function startCamera() {
        cameraContainer.style.display = 'block';
        selfieUpload.disabled = true;
        
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(mediaStream) {
                stream = mediaStream;
                video.srcObject = mediaStream;
                video.play();
            })
            .catch(function(error) {
                console.error('Error al acceder a la cámara:', error);
                showToast('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
                cameraContainer.style.display = 'none';
                selfieUpload.disabled = false;
            });
    }
    
    // Función para detener la cámara
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraContainer.style.display = 'none';
        selfieUpload.disabled = false;
    }
    
    // Función para capturar foto desde la cámara
    function capturePhoto() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir canvas a blob
        canvas.toBlob(function(blob) {
            selfieImageFile = blob;
            selfiePreview.src = canvas.toDataURL('image/jpeg');
            selfiePreview.classList.add('loaded');
            stopCamera();
            checkVerifyButton();
            
            // Animación de éxito
            animateSuccess('selfie-preview');
        }, 'image/jpeg');
    }
    
    // Función para verificar si el botón de verificación debe estar habilitado
    function checkVerifyButton() {
        if (idImageFile && selfieImageFile) {
            verifyBtn.disabled = false;
            verifyBtn.classList.add('pulse-animation');
        } else {
            verifyBtn.disabled = true;
            verifyBtn.classList.remove('pulse-animation');
        }
    }
    
    // Función para verificar identidad
    function verifyIdentity() {
        // Mostrar cargando
        loadingOverlay.style.display = 'flex';
        resultContainer.style.display = 'none';
        
        console.log('Verificando imágenes disponibles:');
        console.log('ID Image:', idImageFile);
        console.log('Selfie Image:', selfieImageFile);
        
        // Validar que ambas imágenes estén presentes
        if (!idImageFile || !selfieImageFile) {
            showError('Por favor, seleccione tanto la imagen de identificación como la selfie.');
            loadingOverlay.style.display = 'none';
            return;
        }
        
        // Crear FormData para enviar las imágenes
        const formData = new FormData();
        formData.append('id_image', idImageFile);
        formData.append('selfie_image', selfieImageFile);
        
        // Detectar si estamos en Netlify o en local
        const apiUrl = window.location.hostname.includes('netlify.app') 
            ? '/.netlify/functions/api/detect'  // URL para Netlify
            : '/detect';                        // URL para local
            
        fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('Respuesta del servidor:', response);
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            
            // Si la respuesta no es exitosa, convertirla a JSON para mostrar el error
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Error en la verificación');
                });
            }
            
            return response.json();
        })
        .then(data => {
            console.log('Datos de verificación:', data);
            loadingOverlay.style.display = 'none';
            displayResults(data);
        })
        .catch(error => {
            console.error('Error en la verificación:', error);
            loadingOverlay.style.display = 'none';
            showError(error.message || 'Error en el proceso de verificación');
        });
    }
    
    // Función para mostrar resultados de verificación
    function displayResults(data) {
        resultContainer.style.display = 'block';
        
        // Extraer resultados de verificación e información de ID
        const verificationResult = data.verification_result;
        const idInfo = data.id_info;
        
        if (verificationResult.isIdentical) {
            resultAlert.className = 'alert alert-success';
            resultTitle.innerHTML = '<i class="fas fa-check-circle me-2"></i> Verificación Exitosa';
            
            // Mostrar mensaje de verificación
            let message = `La identidad ha sido verificada correctamente.<br><br>`;
            
            // Agregar información de la identificación
            message += `<strong>Información del documento:</strong><br>`;
            message += `<ul>`;
            message += `<li><strong>Nombre:</strong> ${idInfo.nombre}</li>`;
            message += `<li><strong>Apellido:</strong> ${idInfo.apellido}</li>`;
            message += `<li><strong>Número de ID:</strong> ${idInfo.id_number}</li>`;
            message += `</ul>`;
            
            // Agregar nota informativa si existe
            if (idInfo.nota) {
                message += `<small class="text-muted"><i>${idInfo.nota}</i></small><br><br>`;
            } else {
                message += `<br>`;
            }
            
            // Agregar mensaje adicional
            message += `${verificationResult.message}`;
            
            resultMessage.innerHTML = message;
        } else {
            resultAlert.className = 'alert alert-danger';
            resultTitle.innerHTML = '<i class="fas fa-times-circle me-2"></i> Verificación Fallida';
            resultMessage.innerHTML = 'Las imágenes no corresponden a la misma persona. Por favor, intente nuevamente.';
        }
        
        // Mostrar puntuación de confianza
        confidenceScore.style.display = 'block';
        const percentage = Math.round(verificationResult.confidence * 100);
        confidenceScore.innerHTML = `<i class="fas fa-chart-line me-2"></i> Confianza: ${percentage}%`;
        
        // Animar entrada de resultados
        setTimeout(() => {
            resultAlert.classList.add('animate-in');
        }, 100);
    }
    
    // Función para mostrar error
    function showError(message) {
        resultContainer.style.display = 'block';
        resultAlert.className = 'alert alert-danger';
        resultTitle.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i> Error';
        resultMessage.textContent = message;
        document.getElementById('result-details').style.display = 'none';
        
        // Animar entrada de resultados
        setTimeout(() => {
            resultAlert.classList.add('animate-in');
        }, 100);
    }
    
    // Agregar estilos CSS adicionales para las animaciones
    const style = document.createElement('style');
    style.textContent = `
        .drag-over {
            border-color: var(--primary-color) !important;
            background-color: rgba(66, 133, 244, 0.05) !important;
        }
        
        .success-animation {
            animation: pulse 0.7s ease;
        }
        
        .pulse-animation {
            animation: pulse 1.5s infinite;
        }
        
        .loaded {
            animation: fadeIn 0.5s ease;
        }
        
        .animate-in {
            animation: slideIn 0.3s ease-out;
        }
        
        .toast-notification {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            z-index: 10000;
            transition: transform 0.3s ease;
        }
        
        .toast-notification.show {
            transform: translateX(-50%) translateY(0);
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        
        @keyframes slideIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});
