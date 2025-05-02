document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const errorMessage = document.getElementById('error-message');
    const togglePassword = document.getElementById('toggle-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    
    // Verificar si hay credenciales guardadas
    checkSavedCredentials();
    
    // Event listeners
    loginButton.addEventListener('click', attemptLogin);
    
    // También permitir login con Enter
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });
    
    // Mostrar/ocultar contraseña
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Cambiar el icono
        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
    
    // Función para verificar credenciales guardadas
    function checkSavedCredentials() {
        if (localStorage.getItem('rememberMe') === 'true') {
            const savedUsername = localStorage.getItem('username');
            if (savedUsername) {
                usernameInput.value = savedUsername;
                rememberMeCheckbox.checked = true;
            }
        }
    }
    
    // Función para intentar iniciar sesión
    function attemptLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validar campos vacíos
        if (!username || !password) {
            showError('Por favor, complete todos los campos');
            return;
        }
        
        // Credenciales válidas (del lado del cliente, solo para demo)
        const validUsername = 'admin';
        const validPassword = 'smartsolutions';
        
        // Validar credenciales
        if (username === validUsername && password === validPassword) {
            // Guardar preferencia de "Recordarme"
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('username', username);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('username');
            }
            
            // Enviar solicitud al servidor para establecer la sesión
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            fetch('/login', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Mostrar animación de éxito
                    showSuccessAnimation();
                    
                    // Redirigir a la página principal
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    showError(data.message || 'Error de autenticación');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error de conexión. Intente nuevamente.');
            });
        } else {
            showError('Usuario o contraseña incorrectos');
            
            // Limpiar campo de contraseña
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    // Función para mostrar error
    function showError(message) {
        errorMessage.textContent = message;
        loginError.style.display = 'block';
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }
    
    // Función para mostrar animación de éxito
    function showSuccessAnimation() {
        // Crear overlay de éxito
        const successOverlay = document.createElement('div');
        successOverlay.className = 'success-overlay';
        
        const successIcon = document.createElement('div');
        successIcon.className = 'success-icon';
        successIcon.innerHTML = '<i class="fas fa-check"></i>';
        
        successOverlay.appendChild(successIcon);
        document.body.appendChild(successOverlay);
    }
    
    // Agregar estilos CSS para la animación de éxito
    const style = document.createElement('style');
    style.textContent = `
        .success-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(52, 168, 83, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            animation: fadeIn 0.3s ease;
        }
        
        .success-icon {
            width: 80px;
            height: 80px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: scaleIn 0.5s ease;
        }
        
        .success-icon i {
            color: #34a853;
            font-size: 40px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes scaleIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
});
