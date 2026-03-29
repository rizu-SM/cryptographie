from flask import Blueprint, request, jsonify
from Algorithmes.caesar import caesar_encrypt, caesar_decrypt

crypto_bp = Blueprint("crypto", __name__)

@crypto_bp.route("/caesar/encrypt", methods=["POST"])
def encrypt_caesar():
    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = int(data.get("key"))

    result = caesar_encrypt(text, key)
    return jsonify({"ciphertext": result})


@crypto_bp.route("/caesar/decrypt", methods=["POST"])
def decrypt_caesar():
    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = int(data.get("key"))

    result = caesar_decrypt(text, key)
    return jsonify({"plaintext": result})