import hashlib
import secrets

from Algorithmes.Asymetrique.ElGamal import (
    gcd,
    generate_keys as generate_elgamal_keys,
    mod_inverse,
)


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


def generate_keys(bits=32, p=None, g=None, x=None):
    """
    Genere des cles ElGamal utilisables pour la signature.
    Cle privee: x
    Cle publique: (p, g, y) avec y = g^x mod p
    """
    keys = generate_elgamal_keys(bits=bits, p=p, g=g, s=x)
    private_x = keys["private_key"]["s"]

    return {
        "public_key": keys["public_key"],
        "private_key": {"x": private_x},
    }


def _choose_k(p):
    while True:
        k = 1 + secrets.randbelow(p - 2)
        if gcd(k, p - 1) == 1:
            return k


def elgamal_sign(message, p, g, x, k=None, hash_algorithm="sha256"):
    """
    Signature ElGamal:
    1. choisir k avec pgcd(k, p - 1) = 1
    2. r = g^k mod p
    3. s = k^-1(H(m) - x*r) mod (p - 1)
    4. signature = (r, s)
    """
    p = _parse_int(p, "p")
    g = _parse_int(g, "g")
    x = _parse_int(x, "x")

    if not (1 <= x <= p - 2):
        raise ValueError("x doit etre dans 1...p-2")

    if k is None:
        k = _choose_k(p)
    else:
        k = _parse_int(k, "k")
        if not (1 <= k <= p - 2):
            raise ValueError("k doit etre dans 1...p-2")
        if gcd(k, p - 1) != 1:
            raise ValueError("k doit etre premier avec p-1")

    digest = _hash_message(message, hash_algorithm)
    hash_int = int(digest, 16)
    hash_mod = hash_int % (p - 1)
    r = pow(g, k, p)
    k_inverse = mod_inverse(k, p - 1)
    s = (k_inverse * (hash_int - x * r)) % (p - 1)

    return {
        "message": message,
        "hash_algorithm": (hash_algorithm or "sha256").lower(),
        "hash": digest,
        "hash_int": hash_int,
        "hash_mod_p_minus_1": hash_mod,
        "k": k,
        "k_inverse": k_inverse,
        "r": r,
        "s": s,
        "signature": {"r": r, "s": s},
        "formula_r": f"r = g^k mod p = {g}^{k} mod {p}",
        "formula_s": f"s = k^-1(H(m) - x*r) mod (p-1)",
    }


def elgamal_verify(message, r, s, p, g, y, hash_algorithm="sha256"):
    """
    Verification ElGamal:
    1. tester 0 < r < p
    2. u = y^r * r^s mod p
    3. v = g^H(m) mod p
    4. accepter si u = v
    """
    p = _parse_int(p, "p")
    g = _parse_int(g, "g")
    y = _parse_int(y, "y")
    r = _parse_int(r, "r")
    s = _parse_int(s, "s")

    digest = _hash_message(message, hash_algorithm)
    hash_int = int(digest, 16)
    range_valid = 0 < r < p

    if range_valid:
        u = (pow(y, r, p) * pow(r, s, p)) % p
    else:
        u = None

    v = pow(g, hash_int, p)
    valid = range_valid and u == v

    return {
        "message": message,
        "hash_algorithm": (hash_algorithm or "sha256").lower(),
        "hash": digest,
        "hash_int": hash_int,
        "hash_mod_p_minus_1": hash_int % (p - 1),
        "range_valid": range_valid,
        "u": u,
        "v": v,
        "valid": valid,
        "formula_u": f"u = y^r * r^s mod p = {y}^{r} * {r}^{s} mod {p}",
        "formula_v": f"v = g^H(m) mod p = {g}^H(m) mod {p}",
    }
