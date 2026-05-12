import hashlib


def sha256_hash(text):
    if not isinstance(text, str):
        raise ValueError("Le texte doit etre une chaine de caracteres")

    return hashlib.sha256(text.encode("utf-8")).hexdigest()

