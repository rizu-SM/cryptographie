from flask import Blueprint, jsonify, request

from Algorithmes.Signature.DSA import (
    dsa_sign,
    dsa_verify,
    generate_keys as generate_dsa_keys,
)
from Algorithmes.Signature.ElGamal import (
    elgamal_sign,
    elgamal_verify,
    generate_keys as generate_elgamal_signature_keys,
)
from Algorithmes.Signature.RSA import (
    rsa_decrypt_and_verify,
    rsa_sign,
    rsa_sign_and_encrypt,
    rsa_verify,
)


signature_bp = Blueprint("signature", __name__)


def _first_present(data, *names):
    for name in names:
        if name in data:
            return data[name]
    return None


@signature_bp.route("/signature/rsa/sign", methods=["POST"])
def sign_rsa():
    data = request.get_json(silent=True) or {}
    text = data.get("text") if "text" in data else data.get("message")
    n = data.get("n")
    d = data.get("d")
    hash_algorithm = data.get("hash_algorithm", "sha256")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' ou 'message' est requis"}), 400
    if n is None or d is None:
        return jsonify({"error": "Les champs 'n' et 'd' sont requis"}), 400

    try:
        return jsonify(rsa_sign(text, n, d, hash_algorithm))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/dsa/generate-keys", methods=["POST"])
def generate_dsa_signature():
    data = request.get_json(silent=True) or {}

    try:
        keys = generate_dsa_keys(
            p=data.get("p"),
            q=data.get("q"),
            g=data.get("g"),
            x=data.get("x"),
            h=data.get("h"),
        )
        return jsonify(keys)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/dsa/sign", methods=["POST"])
def sign_dsa():
    data = request.get_json(silent=True) or {}
    text = data.get("text") if "text" in data else data.get("message")
    p = data.get("p")
    q = data.get("q")
    g = data.get("g")
    x = data.get("x")
    k = data.get("k")
    hash_algorithm = data.get("hash_algorithm", "sha256")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' ou 'message' est requis"}), 400
    if p is None or q is None or g is None or x is None:
        return jsonify({"error": "Les champs 'p', 'q', 'g' et 'x' sont requis"}), 400

    try:
        return jsonify(dsa_sign(text, p, q, g, x, k, hash_algorithm))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/dsa/verify", methods=["POST"])
def verify_dsa():
    data = request.get_json(silent=True) or {}
    text = data.get("text") if "text" in data else data.get("message")
    signature = data.get("signature") or {}
    r = data.get("r", signature.get("r"))
    s = data.get("s", signature.get("s"))
    p = data.get("p")
    q = data.get("q")
    g = data.get("g")
    y = data.get("y")
    hash_algorithm = data.get("hash_algorithm", "sha256")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' ou 'message' est requis"}), 400
    if r is None or s is None or p is None or q is None or g is None or y is None:
        return jsonify({"error": "Les champs 'r', 's', 'p', 'q', 'g' et 'y' sont requis"}), 400

    try:
        return jsonify(dsa_verify(text, r, s, p, q, g, y, hash_algorithm))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/elgamal/generate-keys", methods=["POST"])
def generate_elgamal_signature():
    data = request.get_json(silent=True) or {}

    try:
        keys = generate_elgamal_signature_keys(
            bits=int(data.get("bits", 32)),
            p=data.get("p"),
            g=data.get("g"),
            x=_first_present(data, "x", "s"),
        )
        return jsonify(keys)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/elgamal/sign", methods=["POST"])
def sign_elgamal():
    data = request.get_json(silent=True) or {}
    text = data.get("text") if "text" in data else data.get("message")
    p = data.get("p")
    g = data.get("g")
    x = _first_present(data, "x", "s")
    k = data.get("k")
    hash_algorithm = data.get("hash_algorithm", "sha256")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' ou 'message' est requis"}), 400
    if p is None or g is None or x is None:
        return jsonify({"error": "Les champs 'p', 'g' et 'x' sont requis"}), 400

    try:
        return jsonify(elgamal_sign(text, p, g, x, k, hash_algorithm))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/elgamal/verify", methods=["POST"])
def verify_elgamal():
    data = request.get_json(silent=True) or {}
    text = data.get("text") if "text" in data else data.get("message")
    signature = data.get("signature") or {}
    r = data.get("r", signature.get("r"))
    s = data.get("s", signature.get("s"))
    p = data.get("p")
    g = data.get("g")
    y = data.get("y")
    hash_algorithm = data.get("hash_algorithm", "sha256")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' ou 'message' est requis"}), 400
    if r is None or s is None or p is None or g is None or y is None:
        return jsonify({"error": "Les champs 'r', 's', 'p', 'g' et 'y' sont requis"}), 400

    try:
        return jsonify(elgamal_verify(text, r, s, p, g, y, hash_algorithm))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/rsa/verify", methods=["POST"])
def verify_rsa():
    data = request.get_json(silent=True) or {}
    text = data.get("text") if "text" in data else data.get("message")
    signature = data.get("signature")
    n = data.get("n")
    e = data.get("e")
    hash_algorithm = data.get("hash_algorithm", "sha256")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' ou 'message' est requis"}), 400
    if signature is None or n is None or e is None:
        return jsonify({"error": "Les champs 'signature', 'n' et 'e' sont requis"}), 400

    try:
        return jsonify(rsa_verify(text, signature, n, e, hash_algorithm))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/rsa/sign-and-encrypt", methods=["POST"])
def sign_and_encrypt_rsa():
    data = request.get_json(silent=True) or {}
    text = data.get("text") if "text" in data else data.get("message")
    signer_n = _first_present(data, "signer_n", "alice_n", "a_n")
    signer_d = _first_present(data, "signer_d", "alice_d", "a_d")
    receiver_n = _first_present(data, "receiver_n", "bob_n", "b_n")
    receiver_e = _first_present(data, "receiver_e", "bob_e", "b_e")
    hash_algorithm = data.get("hash_algorithm", "sha256")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' ou 'message' est requis"}), 400
    if signer_n is None or signer_d is None or receiver_n is None or receiver_e is None:
        return jsonify({
            "error": "Les champs signer_n, signer_d, receiver_n et receiver_e sont requis"
        }), 400

    try:
        result = rsa_sign_and_encrypt(
            text,
            signer_n,
            signer_d,
            receiver_n,
            receiver_e,
            hash_algorithm,
        )
        return jsonify(result)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@signature_bp.route("/signature/rsa/decrypt-and-verify", methods=["POST"])
def decrypt_and_verify_rsa():
    data = request.get_json(silent=True) or {}
    ciphertext = data.get("ciphertext")
    receiver_n = _first_present(data, "receiver_n", "bob_n", "b_n")
    receiver_d = _first_present(data, "receiver_d", "bob_d", "b_d")
    signer_n = _first_present(data, "signer_n", "alice_n", "a_n")
    signer_e = _first_present(data, "signer_e", "alice_e", "a_e")
    hash_algorithm = data.get("hash_algorithm", "sha256")

    if not isinstance(ciphertext, list) or not ciphertext:
        return jsonify({"error": "Le champ 'ciphertext' doit etre une liste d'entiers"}), 400
    if receiver_n is None or receiver_d is None or signer_n is None or signer_e is None:
        return jsonify({
            "error": "Les champs receiver_n, receiver_d, signer_n et signer_e sont requis"
        }), 400

    try:
        result = rsa_decrypt_and_verify(
            ciphertext,
            receiver_n,
            receiver_d,
            signer_n,
            signer_e,
            hash_algorithm,
        )
        return jsonify(result)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500
