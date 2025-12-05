// ARQUIVO: src/main.jsx (CRÍTICO)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'; 
// IMPORTAÇÃO CRÍTICA DO CSS GLOBAL
import './index.css'; // Certifique-se de que este caminho está correto!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)