import hashlib


def sha512_hash(text):
    if not isinstance(text, str):
        raise ValueError("Le texte doit etre une chaine de caracteres")

    return hashlib.sha512(text.encode("utf-8")).hexdigest()

