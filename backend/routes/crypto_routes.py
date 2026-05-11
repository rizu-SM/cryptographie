from flask import Blueprint, request, jsonify
from Algorithmes.Simple.caesar import caesar_encrypt, caesar_decrypt
from Algorithmes.Simple.affine import affine_encrypt, affine_decrypt
from Algorithmes.Simple.hill import hill_encrypt, hill_decrypt
from Algorithmes.Simple.playfaire import playfair_encrypt, playfair_decrypt
from Algorithmes.Simple.vigenere import vigenere_encrypt, vigenere_decrypt
from Algorithmes.symetrique.RC4 import rc4_decrypt, rc4_encrypt
from Algorithmes.symetrique.DES import des_encrypt, des_decrypt
from Algorithmes.symetrique.AES import aes_encrypt, aes_decrypt
from Algorithmes.Asymetrique.RSA import generate_keys, generate_keys_from_pq, rsa_encrypt, rsa_decrypt


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
    
@crypto_bp.route("/aes/encrypt", methods=["POST"])
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


@crypto_bp.route("/aes/decrypt", methods=["POST"])
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


# ==================== RSA ====================

@crypto_bp.route("/rsa/generate-keys", methods=["POST"])
def rsa_generate_keys():
    """
    Genere une paire de cles RSA.
    Option A - petits premiers : { "p": 7, "q": 11 }
    Option B - aleatoire       : { "bits": 512 }  (512, 1024 ou 2048)
    Retourne : { p, q, n, phi, public_key:{n,e}, private_key:{n,d} }
    """
    data = request.get_json(silent=True) or {}
    p    = data.get("p")
    q    = data.get("q")
    bits = data.get("bits", 512)

    try:
        if p is not None and q is not None:
            keys = generate_keys_from_pq(int(p), int(q))
        else:
            if bits not in (512, 1024, 2048):
                return jsonify({"error": "bits doit etre 512, 1024 ou 2048"}), 400
            keys = generate_keys(bits)
        return jsonify(keys)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@crypto_bp.route("/rsa/encrypt", methods=["POST"])
def encrypt_rsa():
    """
    Chiffre un message avec la cle publique RSA (chiffrement direct, sans padding).
    Body JSON : { "text": "...", "n": <int>, "e": <int> }
    Retourne  : { "ciphertext": [c1, c2, ...] }   (liste d'entiers)
    """
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    n    = data.get("n")
    e    = data.get("e")

    if not isinstance(text, str) or not text:
        return jsonify({"error": "Le champ 'text' est requis"}), 400
    if n is None or e is None:
        return jsonify({"error": "Les champs 'n' et 'e' sont requis"}), 400

    try:
        ciphertext = rsa_encrypt(text, int(n), int(e))
        return jsonify({"ciphertext": ciphertext})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@crypto_bp.route("/rsa/decrypt", methods=["POST"])
def decrypt_rsa():
    """
    Dechiffre un chiffre RSA avec la cle privee.
    Body JSON : { "ciphertext": [c1, c2, ...], "n": <int>, "d": <int> }
    Retourne  : { "plaintext": "..." }
    """
    data       = request.get_json(silent=True) or {}
    ciphertext = data.get("ciphertext")
    n          = data.get("n")
    d          = data.get("d")

    if not isinstance(ciphertext, list) or not ciphertext:
        return jsonify({"error": "Le champ 'ciphertext' doit etre une liste d'entiers"}), 400
    if n is None or d is None:
        return jsonify({"error": "Les champs 'n' et 'd' sont requis"}), 400

    try:
        plaintext = rsa_decrypt(ciphertext, int(n), int(d))
        return jsonify({"plaintext": plaintext})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500
