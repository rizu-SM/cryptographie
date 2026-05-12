import hashlib


def md5_hash(text):
    if not isinstance(text, str):
        raise ValueError("Le texte doit etre une chaine de caracteres")

    return hashlib.md5(text.encode("utf-8")).hexdigest()

