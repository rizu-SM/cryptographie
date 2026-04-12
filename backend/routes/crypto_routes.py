from flask import Blueprint, request, jsonify
from Algorithmes.Simple.caesar import caesar_encrypt, caesar_decrypt
from Algorithmes.Simple.affine import affine_encrypt, affine_decrypt
from Algorithmes.Simple.hill import hill_encrypt, hill_decrypt
from Algorithmes.Simple.playfaire import playfair_encrypt, playfair_decrypt
from Algorithmes.Simple.vigenere import vigenere_encrypt, vigenere_decrypt
from Algorithmes.symetrique.RC4 import rc4_decrypt, rc4_encrypt
from Algorithmes.symetrique.DES import des_encrypt, des_decrypt


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


@crypto_bp.route("/hill/encrypt", methods=["POST"])
def encrypt_hill():
    data = request.get_json()

    if not data or "text" not in data or "key_matrix" not in data:
        return jsonify({"error": "Missing 'text' or 'key_matrix'"}), 400

    text = data.get("text")
    key_matrix = data.get("key_matrix")

    if not text.replace(" ", "").isalpha():
        return jsonify({"error": "Text must contain only letters"}), 400

    try:
        result = hill_encrypt(text, key_matrix)
        return jsonify({"ciphertext": result})
    except (TypeError, ValueError) as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route("/hill/decrypt", methods=["POST"])
def decrypt_hill():
    data = request.get_json()

    if not data or "text" not in data or "key_matrix" not in data:
        return jsonify({"error": "Missing 'text' or 'key_matrix'"}), 400

    text = data.get("text")
    key_matrix = data.get("key_matrix")

    if not text.replace(" ", "").isalpha():
        return jsonify({"error": "Text must contain only letters"}), 400

    try:
        result = hill_decrypt(text, key_matrix)
        return jsonify({"plaintext": result})
    except (TypeError, ValueError) as e:
        return jsonify({"error": str(e)}), 400


@crypto_bp.route("/playfair/encrypt", methods=["POST"])
def encrypt_playfair():
    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = data.get("key")

    # validation
    if not isinstance(text, str) or not text.replace(" ", "").isalpha():
        return jsonify({"error": "Text must contain only letters"}), 400

    if not isinstance(key, str) or not key.isalpha():
        return jsonify({"error": "Key must contain only letters"}), 400

    try:
        result = playfair_encrypt(text, key)
        return jsonify({"ciphertext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@crypto_bp.route("/playfair/decrypt", methods=["POST"])
def decrypt_playfair():

    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = data.get("key")

    # validation
    if not isinstance(text, str) or not text.replace(" ", "").isalpha():
        return jsonify({"error": "Text must contain only letters"}), 400

    if not isinstance(key, str) or not key.isalpha():
        return jsonify({"error": "Key must contain only letters"}), 400

    try:
        result = playfair_decrypt(text, key)
        return jsonify({"plaintext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@crypto_bp.route("/vigenere/encrypt", methods=["POST"])
def encrypt_vigenere():
    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = data.get("key")

    if not isinstance(text, str) or not text.replace(" ", "").isalpha():
        return jsonify({"error": "Text must contain only letters"}), 400

    if not isinstance(key, str) or not key.isalpha():
        return jsonify({"error": "Key must contain only letters"}), 400

    try:
        result = vigenere_encrypt(text, key)
        return jsonify({"ciphertext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    

@crypto_bp.route("/vigenere/decrypt", methods=["POST"])
def decrypt_vigenere():

    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")
    key = data.get("key")

    if not isinstance(text, str) or not text.replace(" ", "").isalpha():
        return jsonify({"error": "Text must contain only letters"}), 400

    if not isinstance(key, str) or not key.isalpha():
        return jsonify({"error": "Key must contain only letters"}), 400

    try:
        result = vigenere_decrypt(text, key)
        return jsonify({"plaintext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@crypto_bp.route("/rc4/encrypt", methods=["POST"])
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
    
@crypto_bp.route("/rc4/decrypt", methods=["POST"])
def decrypt_rc4():

    data = request.get_json()

    if not data or "text" not in data or "key" not in data:
        return jsonify({"error": "Missing 'text' or 'key'"}), 400

    text = data.get("text")  # hex
    key = data.get("key")

    if not isinstance(text, str) or not isinstance(key, str):
        return jsonify({"error": "Text and key must be strings"}), 400

    try:
        result = rc4_decrypt(key, text)
        return jsonify({"plaintext": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    

@crypto_bp.route("/des/encrypt", methods=["POST"])
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


@crypto_bp.route("/des/decrypt", methods=["POST"])
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