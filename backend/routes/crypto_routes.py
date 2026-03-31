from flask import Blueprint, request, jsonify
from Algorithmes.caesar import caesar_encrypt, caesar_decrypt
from Algorithmes.affine import affine_encrypt, affine_decrypt

crypto_bp = Blueprint("crypto", __name__)

@crypto_bp.route("/caesar/encrypt", methods=["POST"])

def encrypt_caesar():
    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = int(data.get("key"))

    if not text.replace(" ", "").isalpha():  # ← vérification ici
        return jsonify({"error": "Text must contain only letters (a-z, A-Z)"}), 400

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




@crypto_bp.route("/affine/encrypt", methods=["POST"])
def encrypt_affine():
    data = request.get_json()

    if not data or "text" not in data or "a" not in data or "b" not in data:
        return jsonify({"error": "Missing 'text', 'a' or 'b'"}), 400

    text = data.get("text")
    a = int(data.get("a"))
    b = int(data.get("b"))

    if not text.replace(" ", "").isalpha():
        return jsonify({"error": "Text must contain only letters"}), 400

    try:
        result = affine_encrypt(text, a, b)
        return jsonify({"ciphertext": result})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route("/affine/decrypt", methods=["POST"])
def decrypt_affine():
    data = request.get_json()

    if not data or "text" not in data or "a" not in data or "b" not in data:
        return jsonify({"error": "Missing 'text', 'a' or 'b'"}), 400

    text = data.get("text")
    a = int(data.get("a"))
    b = int(data.get("b"))

    if not text.replace(" ", "").isalpha():
        return jsonify({"error": "Text must contain only letters"}), 400

    try:
        result = affine_decrypt(text, a, b)
        return jsonify({"plaintext": result})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400