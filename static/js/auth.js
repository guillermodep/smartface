// Funciones de autenticación
const auth = {
    // Verificar si el usuario está autenticado
    isAuthenticated: function() {
        return localStorage.getItem('authenticated') === 'true';
    },
    
    // Iniciar sesión
    login: function(username, password) {
        return new Promise((resolve, reject) => {
            // Validar credenciales
            if (username === config.validUsername && password === config.validPassword) {
                // Guardar estado de autenticación
                localStorage.setItem('authenticated', 'true');
                localStorage.setItem('username', username);
                resolve(true);
            } else {
                reject(new Error('Usuario o contraseña incorrectos'));
            }
        });
    },
    
    // Cerrar sesión
    logout: function() {
        localStorage.removeItem('authenticated');
        window.location.hash = '#/login';
    },
    
    // Proteger rutas
    requireAuth: function(callback) {
        if (this.isAuthenticated()) {
            return callback();
        } else {
            window.location.hash = '#/login';
            return null;
        }
    }
};
