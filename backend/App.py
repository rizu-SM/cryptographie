from flask import Flask
from flask_cors import CORS
from routes.crypto_routes import crypto_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(crypto_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)