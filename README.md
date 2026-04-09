# 🦆 Cua Cua Cuaccess

**Cua Cua Cuaccess** es una solución tecnológica ligera, eficiente y multiplataforma diseñada para transformar archivos de **Microsoft Access (.accdb)** en una experiencia web moderna.

## 🚀 Características
- **Ultra Rápido:** Consultas procesadas en milisegundos mediante ejecución en memoria.
- **Multiplataforma:** Funciona en Windows, macOS y Linux gracias a Node.js.
- **Sin Drivers:** No requiere la instalación de drivers de Microsoft u ODBC.
- **Catálogo Dinámico:** Interfaz que se auto-genera según la configuración del archivo `config.json`.
- **Motor SQL Estricto:** Soporta filtrado por tipos de datos (Numérico, Texto, Fecha).

## 🛠️ Tech Stack
- **Backend:** Node.js + Fastify.
- **Motor SQL:** Alasql + mdb-reader.
- **Frontend:** Tailwind CSS + Google Material Symbols.
- **Gestión de Colas:** p-queue (evita bloqueos del archivo Access).

## 📦 Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/jromerom21/cua-cua-cuaccess.git
