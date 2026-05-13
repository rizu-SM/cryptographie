from flask import Blueprint

from routes.asymetrique_routes import asymetrique_bp
from routes.hachage_routes import hachage_bp
from routes.partage_secret_routes import partage_secret_bp
from routes.signature_routes import signature_bp
from routes.simple_routes import simple_bp
from routes.symetrique_routes import symetrique_bp


crypto_bp = Blueprint("crypto", __name__)

crypto_bp.register_blueprint(simple_bp)
crypto_bp.register_blueprint(symetrique_bp)
crypto_bp.register_blueprint(asymetrique_bp)
crypto_bp.register_blueprint(signature_bp)
crypto_bp.register_blueprint(partage_secret_bp)
crypto_bp.register_blueprint(hachage_bp)
