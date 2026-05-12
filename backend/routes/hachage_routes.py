from flask import Blueprint, jsonify, request

from Algorithmes.Hachage.MD5 import md5_hash


hachage_bp = Blueprint("hachage", __name__)


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

