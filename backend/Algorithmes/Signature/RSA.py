import hashlib

from Algorithmes.Asymetrique.RSA import rsa_decrypt, rsa_encrypt


def _parse_int(value, name):
    if isinstance(value, str):
        return int(value, 16) if value.startswith("0x") else int(value)
    if isinstance(value, int):
        return value
    raise ValueError(f"Le champ '{name}' doit etre un entier")


def _hash_message(message, hash_algorithm="sha256"):
    if not isinstance(message, str):
        raise ValueError("Le message doit etre une chaine de caracteres")

    algorithm = (hash_algorithm or "sha256").lower()
    if algorithm == "md4":
        from Algorithmes.Hachage.MD4 import md4_hash
        return md4_hash(message)

    if algorithm not in ("md5", "sha1", "sha256", "sha512"):
        raise ValueError("hash_algorithm doit etre md4, md5, sha1, sha256 ou sha512")

    return hashlib.new(algorithm, message.encode("utf-8")).hexdigest()


def rsa_sign(message, n, d, hash_algorithm="sha256"):
    """
    Signature RSA avec une cle privee (d, n).
    Formule: S = H(M)^d mod n
    """
    n = _parse_int(n, "n")
    d = _parse_int(d, "d")
    digest = _hash_message(message, hash_algorithm)
    hash_int = int(digest, 16)
    signature = pow(hash_int, d, n)

    return {
        "message": message,
        "hash_algorithm": (hash_algorithm or "sha256").lower(),
        "hash": digest,
        "hash_int": hash_int,
        "hash_mod_n": hash_int % n,
        "signature": signature,
        "formula": f"S = H(M)^d mod n = H(M)^{d} mod {n}",
    }


def rsa_verify(message, signature, n, e, hash_algorithm="sha256"):
    """
    Verification RSA avec la cle publique (e, n).
    On compare S^e mod n avec H(M) mod n.
    """
    n = _parse_int(n, "n")
    e = _parse_int(e, "e")
    signature = _parse_int(signature, "signature")

    digest = _hash_message(message, hash_algorithm)
    hash_int = int(digest, 16)
    expected_hash_mod_n = hash_int % n
    decrypted_hash_mod_n = pow(signature, e, n)

    return {
        "message": message,
        "hash_algorithm": (hash_algorithm or "sha256").lower(),
        "hash": digest,
        "expected_hash_mod_n": expected_hash_mod_n,
        "decrypted_hash_mod_n": decrypted_hash_mod_n,
        "valid": decrypted_hash_mod_n == expected_hash_mod_n,
        "formula": f"S^e mod n = {signature}^{e} mod {n}",
    }


def rsa_sign_and_encrypt(
    message,
    signer_n,
    signer_d,
    receiver_n,
    receiver_e,
    hash_algorithm="sha256",
):
    """
    A envoie a B un message signe puis chiffre:
    1. E = H(M)
    2. S = E^d_A mod n_A
    3. payload = M :: S
    4. C = RSA_B_public(payload)
    """
    signed = rsa_sign(message, signer_n, signer_d, hash_algorithm)
    signed_payload = f"{message}::{signed['signature']}"
    ciphertext = rsa_encrypt(signed_payload, receiver_n, receiver_e)

    return {
        **signed,
        "encrypted_hash": signed["signature"],
        "signed_payload": signed_payload,
        "ciphertext": ciphertext,
        "steps": [
            "E = H(M)",
            "S = E^d_A mod n_A",
            "payload = M :: S",
            "C = RSA_B_public(payload)",
        ],
    }


def rsa_decrypt_and_verify(
    ciphertext,
    receiver_n,
    receiver_d,
    signer_n,
    signer_e,
    hash_algorithm="sha256",
):
    """
    B recoit, dechiffre et verifie:
    1. payload = RSA_B_private(C)
    2. payload -> M' et S'
    3. E' = S'^e_A mod n_A
    4. verification: E' == H(M') mod n_A
    """
    if not isinstance(ciphertext, list) or not ciphertext:
        raise ValueError("Le ciphertext doit etre une liste d'entiers")

    signed_payload = rsa_decrypt([_parse_int(c, "ciphertext") for c in ciphertext], receiver_n, receiver_d)
    if "::" not in signed_payload:
        raise ValueError("Le message dechiffre ne contient pas de signature separee par '::'")

    message, signature_text = signed_payload.rsplit("::", 1)
    verified = rsa_verify(message, signature_text, signer_n, signer_e, hash_algorithm)

    return {
        **verified,
        "signature": int(signature_text),
        "signed_payload": signed_payload,
        "steps": [
            "payload = RSA_B_private(C)",
            "payload -> M' et S'",
            "E' = S'^e_A mod n_A",
            "verification: E' == H(M') mod n_A",
        ],
    }
