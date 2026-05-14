from flask import Blueprint, jsonify, request

from Algorithmes.PartageSecret.DiffieHellman import (
    diffie_hellman_exchange,
    generate_parameters,
)
from Algorithmes.PartageSecret.Shamir import reconstruct_secret, split_secret


partage_secret_bp = Blueprint("partage_secret", __name__)


@partage_secret_bp.route("/partage-secret/shamir/split", methods=["POST"])
def shamir_split():
    data = request.get_json(silent=True) or {}
    secret = data.get("secret")
    threshold = data.get("threshold")
    num_shares = data.get("num_shares")

    if secret is None or threshold is None or num_shares is None:
        return jsonify({"error": "Les champs 'secret', 'threshold' et 'num_shares' sont requis"}), 400

    try:
        result = split_secret(
            secret=secret,
            threshold=threshold,
            num_shares=num_shares,
            prime=data.get("prime"),
            coefficients=data.get("coefficients"),
            x_values=data.get("x_values"),
        )
        return jsonify(result)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@partage_secret_bp.route("/partage-secret/shamir/reconstruct", methods=["POST"])
def shamir_reconstruct():
    data = request.get_json(silent=True) or {}
    shares = data.get("shares")
    prime = data.get("prime")

    if shares is None or prime is None:
        return jsonify({"error": "Les champs 'shares' et 'prime' sont requis"}), 400

    try:
        return jsonify(reconstruct_secret(shares, prime))
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@partage_secret_bp.route("/protocoles/diffie-hellman/parameters", methods=["POST"])
def diffie_hellman_parameters():
    data = request.get_json(silent=True) or {}

    try:
        result = generate_parameters(
            bits=int(data.get("bits", 32)),
            p=data.get("p"),
            g=data.get("g"),
        )
        return jsonify(result)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@partage_secret_bp.route("/protocoles/diffie-hellman/exchange", methods=["POST"])
def diffie_hellman_exchange_route():
    data = request.get_json(silent=True) or {}

    try:
        result = diffie_hellman_exchange(
            bits=int(data.get("bits", 32)),
            p=data.get("p"),
            g=data.get("g"),
            alice_private=data.get("alice_private"),
            bob_private=data.get("bob_private"),
        )
        return jsonify(result)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500
