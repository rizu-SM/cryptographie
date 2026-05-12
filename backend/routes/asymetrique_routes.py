from flask import Blueprint, jsonify, request

from Algorithmes.Asymetrique.ElGamal import (
    elgamal_decrypt_int,
    elgamal_encrypt_int,
    generate_keys as elgamal_generate_keys,
)
from Algorithmes.Asymetrique.RSA import (
    generate_keys,
    generate_keys_from_pq,
    rsa_decrypt,
    rsa_encrypt,
)


asymetrique_bp = Blueprint("asymetrique", __name__)


@asymetrique_bp.route("/rsa/generate-keys", methods=["POST"])
def rsa_generate_keys():
    data = request.get_json(silent=True) or {}
    p = data.get("p")
    q = data.get("q")
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


@asymetrique_bp.route("/rsa/encrypt", methods=["POST"])
def encrypt_rsa():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    n = data.get("n")
    e = data.get("e")

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


@asymetrique_bp.route("/rsa/decrypt", methods=["POST"])
def decrypt_rsa():
    data = request.get_json(silent=True) or {}
    ciphertext = data.get("ciphertext")
    n = data.get("n")
    d = data.get("d")

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


@asymetrique_bp.route("/elgamal/generate-keys", methods=["POST"])
def elgamal_keys():
    data = request.get_json(silent=True) or {}

    try:
        keys = elgamal_generate_keys(
            bits=int(data.get("bits", 32)),
            p=data.get("p"),
            g=data.get("g"),
            s=data.get("s"),
        )
        return jsonify(keys)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@asymetrique_bp.route("/elgamal/encrypt", methods=["POST"])
def encrypt_elgamal():
    data = request.get_json(silent=True) or {}
    M = data.get("M")
    y = data.get("y")
    g = data.get("g")
    p = data.get("p")

    if M is None or y is None or g is None or p is None:
        return jsonify({"error": "Les champs 'M', 'y', 'g' et 'p' sont requis"}), 400

    try:
        C1, C2 = elgamal_encrypt_int(M, y, g, p, data.get("k"))
        return jsonify({"ciphertext": {"C1": C1, "C2": C2}})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@asymetrique_bp.route("/elgamal/decrypt", methods=["POST"])
def decrypt_elgamal():
    data = request.get_json(silent=True) or {}
    C1 = data.get("C1")
    C2 = data.get("C2")
    s = data.get("s")
    p = data.get("p")

    if C1 is None or C2 is None or s is None or p is None:
        return jsonify({"error": "Les champs 'C1', 'C2', 's' et 'p' sont requis"}), 400

    try:
        M = elgamal_decrypt_int(C1, C2, s, p)
        return jsonify({"plaintext": M})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500

