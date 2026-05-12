from flask import Blueprint, jsonify, request

from Algorithmes.symetrique.AES import aes_decrypt, aes_encrypt
from Algorithmes.symetrique.DES import des_decrypt, des_encrypt
from Algorithmes.symetrique.RC4 import rc4_decrypt, rc4_encrypt


symetrique_bp = Blueprint("symetrique", __name__)


@symetrique_bp.route("/rc4/encrypt", methods=["POST"])
def encrypt_rc4():
    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = data.get("key")

    if not isinstance(text, str) or not isinstance(key, str):
        return jsonify({"error": "Text and key must be strings"}), 400

    try:
        result = rc4_encrypt(key, text)
        return jsonify({"ciphertext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@symetrique_bp.route("/rc4/decrypt", methods=["POST"])
def decrypt_rc4():
    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = data.get("key")

    if not isinstance(text, str) or not isinstance(key, str):
        return jsonify({"error": "Text and key must be strings"}), 400

    try:
        result = rc4_decrypt(key, text)
        return jsonify({"plaintext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@symetrique_bp.route("/des/encrypt", methods=["POST"])
def encrypt_des():
    data = request.get_json()

    text = data.get("text")
    key = data.get("key")

    if not text or not key:
        return jsonify({"error": "Missing text or key"}), 400

    try:
        result = des_encrypt(text, key)
        return jsonify({"ciphertext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@symetrique_bp.route("/des/decrypt", methods=["POST"])
def decrypt_des():
    data = request.get_json()

    text = data.get("text")
    key = data.get("key")

    if not text or not key:
        return jsonify({"error": "Missing text or key"}), 400

    try:
        result = des_decrypt(text, key)
        return jsonify({"plaintext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@symetrique_bp.route("/aes/encrypt", methods=["POST"])
def encrypt_aes():
    data = request.get_json(silent=True) or {}
    text = data.get("text") or data.get("message")
    key = data.get("key")

    if not isinstance(text, str) or not isinstance(key, str):
        return jsonify({"error": "text and key are required"}), 400

    key_bytes = key.encode("utf-8")
    if len(key_bytes) not in (16, 24, 32):
        return jsonify({"error": "AES key must be 16, 24, or 32 bytes long"}), 400

    try:
        cipher = aes_encrypt(text.encode("utf-8"), key_bytes)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"ciphertext": cipher.hex()})


@symetrique_bp.route("/aes/decrypt", methods=["POST"])
def decrypt_aes():
    data = request.get_json(silent=True) or {}
    ciphertext = data.get("ciphertext") or data.get("text")
    key = data.get("key")

    if not isinstance(ciphertext, str) or not isinstance(key, str):
        return jsonify({"error": "ciphertext and key are required"}), 400

    key_bytes = key.encode("utf-8")
    if len(key_bytes) not in (16, 24, 32):
        return jsonify({"error": "AES key must be 16, 24, or 32 bytes long"}), 400

    try:
        cipher_bytes = bytes.fromhex(ciphertext)
        plain = aes_decrypt(cipher_bytes, key_bytes)
        plaintext = plain.decode("utf-8")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except UnicodeDecodeError:
        return jsonify({"error": "Decrypted data is not valid UTF-8 text"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"plaintext": plaintext})

