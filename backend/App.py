from flask import Flask
from routes.crypto_routes import crypto_bp
from flask_cors import CORS

app = Flask(__name__)

app.register_blueprint(crypto_bp, url_prefix="/api")


CORS(app)  # ← Ajoute ceci juste après la création de app
if __name__ == "__main__":
    app.run(debug=True)