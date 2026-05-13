from flask import Blueprint, jsonify, request

from Algorithmes.Protocoles.DiffieHellman import (
    compute_shared_secret,
    diffie_hellman_exchange,
    generate_parameters,
    generate_private_key,
    generate_public_key,
)


protocoles_bp = Blueprint("protocoles", __name__)


@protocoles_bp.route("/protocoles/diffie-hellman/parameters", methods=["POST"])
def diffie_hellman_parameters():
    data = request.get_json(silent=True) or {}

    try:
        params = generate_parameters(
            bits=int(data.get("bits", 32)),
            p=data.get("p"),
            g=data.get("g"),
        )
        return jsonify(params)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@protocoles_bp.route("/protocoles/diffie-hellman/generate-key", methods=["POST"])
def diffie_hellman_generate_key():
    data = request.get_json(silent=True) or {}
    p = data.get("p")
    g = data.get("g")

    if p is None or g is None:
        return jsonify({"error": "Les champs 'p' et 'g' sont requis"}), 400

    try:
        private_key = generate_private_key(p, data.get("private_key"))
        public_key = generate_public_key(g, p, private_key)
        return jsonify({
            "private_key": private_key,
            "public_key": public_key,
            "formula": f"public_key = g^private_key mod p = {int(g)}^{private_key} mod {int(p)}",
        })
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@protocoles_bp.route("/protocoles/diffie-hellman/shared-secret", methods=["POST"])
def diffie_hellman_shared_secret():
    data = request.get_json(silent=True) or {}
    other_public_key = data.get("other_public_key")
    private_key = data.get("private_key")
    p = data.get("p")

    if other_public_key is None or private_key is None or p is None:
        return jsonify({"error": "Les champs 'other_public_key', 'private_key' et 'p' sont requis"}), 400

    try:
        shared_secret = compute_shared_secret(other_public_key, private_key, p)
        return jsonify({
            "shared_secret": shared_secret,
            "formula": f"K = other_public_key^private_key mod p = {int(other_public_key)}^{int(private_key)} mod {int(p)}",
        })
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@protocoles_bp.route("/protocoles/diffie-hellman/exchange", methods=["POST"])
def diffie_hellman_full_exchange():
    data = request.get_json(silent=True) or {}

    try:
        exchange = diffie_hellman_exchange(
            bits=int(data.get("bits", 32)),
            p=data.get("p"),
            g=data.get("g"),
            alice_private=data.get("alice_private"),
            bob_private=data.get("bob_private"),
        )
        return jsonify(exchange)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500
