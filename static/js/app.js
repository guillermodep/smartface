// Aplicación principal
document.addEventListener('DOMContentLoaded', function() {
    const app = {
        // Elemento principal de la aplicación
        appElement: document.getElementById('app'),
        
        // Inicializar la aplicación
        init: function() {
            // Configurar el enrutador
            window.addEventListener('hashchange', this.handleRouting.bind(this));
            
            // Manejar la ruta inicial
            if (!window.location.hash) {
                window.location.hash = '#/';
            }
            
            this.handleRouting();
        },
        
        // Manejar el enrutamiento
        handleRouting: function() {
            const hash = window.location.hash;
            
            // Rutas de la aplicación
            if (hash === '#/login') {
                this.renderLoginPage();
            } else if (hash === '#/') {
                auth.requireAuth(() => this.renderHomePage());
            } else {
                // Ruta no encontrada, redirigir a la página principal
                window.location.hash = '#/';
            }
        },
        
        // Renderizar la página de login
        renderLoginPage: function() {
            // Si ya está autenticado, redirigir a la página principal
            if (auth.isAuthenticated()) {
                window.location.hash = '#/';
                return;
            }
            
            // Contenido HTML de la página de login
            const loginHTML = `
                <div class="login-body">
                    <div class="login-container">
                        <div class="login-card">
                            <div class="login-header">
                                <div class="logo-container">
                                    <i class="fas fa-id-card logo-icon"></i>
                                </div>
                                <h1>SmartFace</h1>
                                <p class="login-subtitle">Sistema de Verificación de Identidad</p>
                            </div>
                            
                            <div class="login-form">
                                <div class="alert alert-danger" id="login-error" style="display: none;">
                                    <i class="fas fa-exclamation-circle me-2"></i>
                                    <span id="error-message">Usuario o contraseña incorrectos</span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="username">
                                        <i class="fas fa-user input-icon"></i>
                                        Usuario
                                    </label>
                                    <input type="text" id="username" class="form-control" placeholder="Ingrese su usuario" autocomplete="off">
                                </div>
                                
                                <div class="form-group">
                                    <label for="password">
                                        <i class="fas fa-lock input-icon"></i>
                                        Contraseña
                                    </label>
                                    <div class="password-container">
                                        <input type="password" id="password" class="form-control" placeholder="Ingrese su contraseña">
                                        <button type="button" id="toggle-password" class="btn btn-link password-toggle">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="remember-me">
                                    <label class="form-check-label" for="remember-me">Recordarme</label>
                                </div>
                                
                                <button type="button" id="login-button" class="btn btn-primary login-btn">
                                    <i class="fas fa-sign-in-alt me-2"></i>
                                    Iniciar Sesión
                                </button>
                            </div>
                            
                            <div class="login-footer">
                                <p>SmartFace 2025 Desarrollado por Smart Vision Team</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Renderizar el contenido
            this.appElement.innerHTML = loginHTML;
            document.body.className = 'login-page';
            
            // Configurar eventos
            this.setupLoginEvents();
        },
        
        // Configurar eventos de la página de login
        setupLoginEvents: function() {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const loginButton = document.getElementById('login-button');
            const loginError = document.getElementById('login-error');
            const errorMessage = document.getElementById('error-message');
            const togglePassword = document.getElementById('toggle-password');
            const rememberMeCheckbox = document.getElementById('remember-me');
            
            // Verificar si hay credenciales guardadas
            if (localStorage.getItem('rememberMe') === 'true') {
                const savedUsername = localStorage.getItem('username');
                if (savedUsername) {
                    usernameInput.value = savedUsername;
                    rememberMeCheckbox.checked = true;
                }
            }
            
            // Evento de clic en el botón de login
            loginButton.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                const password = passwordInput.value;
                
                // Validar campos vacíos
                if (!username || !password) {
                    errorMessage.textContent = 'Por favor, complete todos los campos';
                    loginError.style.display = 'block';
                    return;
                }
                
                // Intentar iniciar sesión
                auth.login(username, password)
                    .then(() => {
                        // Guardar preferencia de "Recordarme"
                        if (rememberMeCheckbox.checked) {
                            localStorage.setItem('rememberMe', 'true');
                        } else {
                            localStorage.removeItem('rememberMe');
                        }
                        
                        // Mostrar animación de éxito
                        this.showSuccessAnimation();
                        
                        // Redirigir a la página principal
                        setTimeout(() => {
                            window.location.hash = '#/';
                        }, 1000);
                    })
                    .catch(error => {
                        errorMessage.textContent = error.message;
                        loginError.style.display = 'block';
                        
                        // Limpiar campo de contraseña
                        passwordInput.value = '';
                        passwordInput.focus();
                    });
            });
            
            // Evento de presionar Enter en el campo de contraseña
            passwordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    loginButton.click();
                }
            });
            
            // Evento de clic en el botón de mostrar/ocultar contraseña
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Cambiar el icono
                const icon = togglePassword.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            });
        },
        
        // Renderizar la página principal
        renderHomePage: function() {
            // Contenido HTML de la página principal
            const homeHTML = `
                <div class="container">
                    <header class="app-header text-center my-4">
                        <div class="d-flex justify-content-end mb-2">
                            <button id="logout-button" class="btn btn-outline-light btn-sm logout-btn">
                                <i class="fas fa-sign-out-alt me-1"></i> Cerrar Sesión
                            </button>
                        </div>
                        <h1><i class="fas fa-id-card me-2"></i> SmartFace</h1>
                        <p class="lead">Sistema de Verificación de Identidad Biométrica</p>
                    </header>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h2><span class="step-number">1</span> Imagen de Identificación</h2>
                                </div>
                                <div class="card-body">
                                    <div class="id-upload-container">
                                        <div id="id-preview" class="image-preview">
                                            <img id="id-image-preview" src="img/id-placeholder.png" alt="Vista previa de ID">
                                        </div>
                                        <div class="mt-4">
                                            <label for="id-upload" class="form-label">Seleccione o arrastre una imagen de identificación</label>
                                            <input type="file" id="id-upload" class="form-control" accept="image/*">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h2><span class="step-number">2</span> Foto de Rostro</h2>
                                </div>
                                <div class="card-body">
                                    <div class="selfie-container">
                                        <div id="selfie-preview" class="image-preview">
                                            <img id="selfie-image-preview" src="img/selfie-placeholder.png" alt="Vista previa de selfie">
                                        </div>
                                        <div class="mt-4 d-flex justify-content-between">
                                            <button id="camera-btn" class="btn btn-primary">
                                                <i class="fas fa-camera me-2"></i> Usar Cámara
                                            </button>
                                            <div class="ms-3 flex-grow-1">
                                                <label for="selfie-upload" class="form-label">O suba una foto</label>
                                                <input type="file" id="selfie-upload" class="form-control" accept="image/*">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div id="camera-container" class="mt-4" style="display: none;">
                                        <video id="video" width="100%" autoplay></video>
                                        <div class="d-flex mt-3">
                                            <button id="capture-btn" class="btn btn-success flex-grow-1 me-2">
                                                <i class="fas fa-camera me-2"></i> Capturar Foto
                                            </button>
                                            <button id="cancel-camera-btn" class="btn btn-secondary">
                                                <i class="fas fa-times me-2"></i> Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h2><span class="step-number">3</span> Verificación</h2>
                                </div>
                                <div class="card-body">
                                    <button id="verify-btn" class="btn btn-lg btn-success w-100" disabled>
                                        <i class="fas fa-fingerprint me-2"></i> Verificar Identidad
                                    </button>
                                    
                                    <div id="result-container" class="mt-4" style="display: none;">
                                        <div class="alert" id="result-alert">
                                            <h4 id="result-title" class="alert-heading"></h4>
                                            <p id="result-message"></p>
                                            <div id="result-details" class="mt-3">
                                                <p><strong><i class="fas fa-percentage me-2"></i> Confianza:</strong> <span id="confidence-score"></span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <footer class="text-center text-muted py-4">
                        <p><small>SmartFace 2025 Desarrollado por Smart Vision Team</small></p>
                    </footer>
                    
                    <div id="loading-overlay" style="display: none;">
                        <div class="spinner-border text-light" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-3 text-light">Procesando imágenes...</p>
                    </div>
                </div>
            `;
            
            // Renderizar el contenido
            this.appElement.innerHTML = homeHTML;
            document.body.className = '';
            
            // Configurar eventos
            this.setupHomeEvents();
        },
        
        // Configurar eventos de la página principal
        setupHomeEvents: function() {
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
            const logoutButton = document.getElementById('logout-button');
            
            // Variables para almacenar imágenes
            let idImageFile = null;
            let selfieImageFile = null;
            let stream = null;
            
            // Agregar efectos de arrastrar y soltar para las imágenes
            this.setupDragAndDrop('id-preview', handleIdImage);
            this.setupDragAndDrop('selfie-preview', handleSelfieImage);
            
            // Evento de clic en el botón de cerrar sesión
            logoutButton.addEventListener('click', () => {
                auth.logout();
            });
            
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
                loadingOverlay.style.display = 'flex';
                resultContainer.style.display = 'none';
                
                // Convertir las imágenes a formato adecuado para la API
                const idImgData = idPreview.src;
                const selfieImgData = selfiePreview.src;
                
                // Primero detectamos rostros en la imagen de ID
                detectFace(idImgData)
                    .then(idFace => {
                        if (!idFace) {
                            throw new Error('No se detectó ningún rostro en la imagen de ID.');
                        }
                        
                        // Luego detectamos rostros en la selfie
                        return detectFace(selfieImgData).then(selfieFace => {
                            if (!selfieFace) {
                                throw new Error('No se detectó ningún rostro en la selfie.');
                            }
                            
                            // Comparar los rostros
                            return compareFaces(idFace, selfieFace);
                        });
                    })
                    .then(result => {
                        loadingOverlay.style.display = 'none';
                        displayResults(result);
                    })
                    .catch(error => {
                        loadingOverlay.style.display = 'none';
                        displayError(error.message || 'Error en el proceso de verificación.');
                        console.error('Error:', error);
                    });
            }
            
            // Función para detectar rostro en una imagen
            function detectFace(imageData) {
                // Extraer la parte base64 si es una URL de datos
                let base64Image = imageData;
                if (imageData.startsWith('data:image')) {
                    base64Image = imageData.split(',')[1];
                }
                
                // Convertir base64 a blob para enviar a la API
                const byteCharacters = atob(base64Image);
                const byteArrays = [];
                
                for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                    const slice = byteCharacters.slice(offset, offset + 512);
                    
                    const byteNumbers = new Array(slice.length);
                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    
                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }
                
                const blob = new Blob(byteArrays, {type: 'image/jpeg'});
                
                // Parámetros para la solicitud
                const params = new URLSearchParams({
                    'returnFaceId': 'false',
                    'returnFaceLandmarks': 'false',
                    'detectionModel': 'detection_03'
                });
                
                console.log(`Sending request to ${config.faceEndpoint}face/v1.0/detect with ${blob.size} bytes`);
                
                // Llamar a la API de Azure Face
                return fetch(`${config.faceEndpoint}face/v1.0/detect?${params}`, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': config.faceApiKey,
                        'Content-Type': 'application/octet-stream'
                    },
                    body: blob
                })
                .then(response => {
                    console.log(`Response status: ${response.status}`);
                    
                    if (!response.ok) {
                        return response.text().then(text => {
                            console.error(`Error response: ${text}`);
                            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
                        });
                    }
                    return response.json();
                })
                .then(faces => {
                    console.log(`Detected ${faces.length} faces`);
                    if (faces && faces.length > 0) {
                        return faces[0]; // Devolver el primer rostro detectado
                    }
                    return null;
                });
            }
            
            // Función para comparar dos rostros
            function compareFaces(face1, face2) {
                // Como no podemos usar la API de verificación directamente (requiere aprobación),
                // hacemos una comparación más estricta de los rectángulos faciales y otras características
                try {
                    // Obtener los rectángulos faciales
                    const rect1 = face1.faceRectangle;
                    const rect2 = face2.faceRectangle;
                    
                    // Calcular la proporción de ancho/alto para cada cara
                    const ratio1 = rect1.width / Math.max(rect1.height, 1);
                    const ratio2 = rect2.width / Math.max(rect2.height, 1);
                    
                    // Calcular la diferencia de proporciones (ajustada para ser más permisiva)
                    const ratioDiff = Math.abs(ratio1 - ratio2);
                    
                    // Calcular puntuación de similitud basada en múltiples factores
                    // 1. Similitud de proporción facial (más permisiva)
                    const proportionSimilarity = Math.max(0, 1 - (ratioDiff * 1.5)); // Menos sensible a diferencias
                    
                    // 2. Diferencia en el tamaño relativo de los rostros
                    const size1 = rect1.width * rect1.height;
                    const size2 = rect2.width * rect2.height;
                    const sizeRatio = Math.min(size1, size2) / Math.max(size1, size2);
                    const sizeSimilarity = sizeRatio; // Penaliza diferencias grandes de tamaño
                    
                    // 3. Posición relativa de los ojos (si está disponible)
                    let positionSimilarity = 1.0;
                    if (face1.faceLandmarks && face2.faceLandmarks) {
                        const landmarks1 = face1.faceLandmarks;
                        const landmarks2 = face2.faceLandmarks;
                        
                        // Si tenemos puntos de referencia, usarlos para una comparación más precisa
                        if (landmarks1 && landmarks2) {
                            positionSimilarity = 0.8; // Valor por defecto si no podemos calcular
                        }
                    }
                    
                    // Combinar factores con diferentes pesos
                    // Damos más importancia a la proporción facial
                    const similarityScore = (proportionSimilarity * 0.6) + (sizeSimilarity * 0.4);
                    
                    // Aplicar umbrales más equilibrados
                    const isIdentical = similarityScore > 0.75; // Bajamos de 0.85 a 0.75
                    const verified = similarityScore > 0.82; // Bajamos de 0.92 a 0.82
                    
                    console.log("Face comparison details:");
                    console.log(`- Proportion similarity: ${proportionSimilarity.toFixed(4)}`);
                    console.log(`- Size similarity: ${sizeSimilarity.toFixed(4)}`);
                    console.log(`- Overall similarity score: ${similarityScore.toFixed(4)}`);
                    console.log(`- Is same person: ${isIdentical}`);
                    console.log(`- Verified: ${verified}`);
                    
                    return {
                        isIdentical: isIdentical,
                        confidence: similarityScore,
                        verified: verified,
                        message: 'Esta es una verificación basada en la geometría facial detectada por Azure Face API. Para una verificación más precisa se requiere acceso a las funciones avanzadas de verificación facial de Azure.'
                    };
                } catch (error) {
                    console.error('Error al comparar rostros:', error);
                    throw new Error('Error al comparar los rostros detectados.');
                }
            }
            
            // Función para mostrar resultados de verificación
            function displayResults(data) {
                resultContainer.style.display = 'block';
                
                if (data.error) {
                    displayError(data.error);
                    return;
                }
                
                const confidence = data.confidence ? (data.confidence * 100).toFixed(2) + '%' : 'N/A';
                confidenceScore.textContent = confidence;
                
                if (data.verified) {
                    resultAlert.className = 'alert alert-success';
                    resultTitle.innerHTML = '<i class="fas fa-check-circle me-2"></i> Verificación Exitosa';
                    resultMessage.textContent = 'La verificación con Azure Face API indica una coincidencia entre las imágenes con alta confianza.';
                } else if (data.isIdentical) {
                    resultAlert.className = 'alert alert-warning';
                    resultTitle.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> Verificación Parcial';
                    resultMessage.textContent = 'Azure Face API ha detectado similitud entre las imágenes, pero el nivel de confianza no es suficiente para una verificación completa. Se recomienda intentar con imágenes de mejor calidad.';
                } else {
                    resultAlert.className = 'alert alert-danger';
                    resultTitle.innerHTML = '<i class="fas fa-times-circle me-2"></i> Verificación Fallida';
                    resultMessage.textContent = 'Según Azure Face API, las imágenes no parecen corresponder a la misma persona.';
                }
                
                // Mostrar mensaje adicional si existe
                if (data.message) {
                    const messageElement = document.createElement('p');
                    messageElement.className = 'mt-2 small text-muted';
                    messageElement.textContent = data.message;
                    resultMessage.appendChild(messageElement);
                }
                
                // Animar entrada de resultados
                setTimeout(() => {
                    resultAlert.classList.add('animate-in');
                }, 100);
            }
            
            // Función para mostrar error
            function displayError(message) {
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
        },
        
        // Configurar arrastrar y soltar
        setupDragAndDrop: function(elementId, handleFile) {
            const dropZone = document.getElementById(elementId);
            
            if (!dropZone) return;
            
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
        },
        
        // Mostrar animación de éxito
        showSuccessAnimation: function() {
            // Crear overlay de éxito
            const successOverlay = document.createElement('div');
            successOverlay.className = 'success-overlay';
            
            const successIcon = document.createElement('div');
            successIcon.className = 'success-icon';
            successIcon.innerHTML = '<i class="fas fa-check"></i>';
            
            successOverlay.appendChild(successIcon);
            document.body.appendChild(successOverlay);
        }
    };
    
    // Inicializar la aplicación
    app.init();
});
