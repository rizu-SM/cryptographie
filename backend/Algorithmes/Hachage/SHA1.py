import hashlib


def sha1_hash(text):
    if not isinstance(text, str):
        raise ValueError("Le texte doit etre une chaine de caracteres")

    return hashlib.sha1(text.encode("utf-8")).hexdigest()

