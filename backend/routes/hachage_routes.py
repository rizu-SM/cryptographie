from flask import Blueprint, jsonify, request

from Algorithmes.Hachage.MD4 import md4_hash
from Algorithmes.Hachage.MD5 import md5_hash
from Algorithmes.Hachage.SHA1 import sha1_hash
from Algorithmes.Hachage.SHA256 import sha256_hash
from Algorithmes.Hachage.SHA512 import sha512_hash


hachage_bp = Blueprint("hachage", __name__)


@hachage_bp.route("/md4/hash", methods=["POST"])
def hash_md4():
    data = request.get_json(silent=True) or {}
    text = data.get("text") or data.get("message")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' est requis"}), 400

    try:
        digest = md4_hash(text)
        return jsonify({"hash": digest})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@hachage_bp.route("/md5/hash", methods=["POST"])
def hash_md5():
    data = request.get_json(silent=True) or {}
    text = data.get("text") or data.get("message")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' est requis"}), 400

    try:
        digest = md5_hash(text)
        return jsonify({"hash": digest})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@hachage_bp.route("/sha1/hash", methods=["POST"])
def hash_sha1():
    data = request.get_json(silent=True) or {}
    text = data.get("text") or data.get("message")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' est requis"}), 400

    try:
        digest = sha1_hash(text)
        return jsonify({"hash": digest})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@hachage_bp.route("/sha256/hash", methods=["POST"])
def hash_sha256():
    data = request.get_json(silent=True) or {}
    text = data.get("text") or data.get("message")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' est requis"}), 400

    try:
        digest = sha256_hash(text)
        return jsonify({"hash": digest})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@hachage_bp.route("/sha512/hash", methods=["POST"])
def hash_sha512():
    data = request.get_json(silent=True) or {}
    text = data.get("text") or data.get("message")

    if not isinstance(text, str):
        return jsonify({"error": "Le champ 'text' est requis"}), 400

    try:
        digest = sha512_hash(text)
        return jsonify({"hash": digest})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
